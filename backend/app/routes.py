"""
API Routes for AI Travel Planner
"""

from datetime import datetime

from flask import Blueprint, jsonify, request
from loguru import logger
from werkzeug.exceptions import BadRequest

from .auth import require_auth
from .services import ai_service, map_service, voice_service
from .services.ai_expense_analyzer import ai_expense_analyzer
from .services.expense_service import expense_service
from .supabase_client import supabase


# Health check
def health_check():
    """Health check endpoint"""
    return jsonify(
        {"success": True, "status": "healthy", "timestamp": datetime.now().isoformat()}
    )


# Authentication routes
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        # Validate required fields
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise BadRequest("Email and password are required")

        # Register user with Supabase Auth
        # Email will be auto-confirmed by database trigger
        result = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": data.get("full_name", ""),
                    }
                },
            }
        )

        if result.user:
            return jsonify(
                {
                    "success": True,
                    "data": {
                        "user": {
                            "id": result.user.id,
                            "email": result.user.email,
                        },
                        "session": {
                            "access_token": result.session.access_token
                            if result.session
                            else None,
                            "refresh_token": result.session.refresh_token
                            if result.session
                            else None,
                        },
                    },
                    "message": "Registration successful",
                }
            )
        else:
            raise Exception("Registration failed")

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


def login():
    """Login user"""
    try:
        data = request.get_json()

        # Validate required fields
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise BadRequest("Email and password are required")

        # Login with Supabase Auth
        result = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        if result.user:
            return jsonify(
                {
                    "success": True,
                    "data": {
                        "user": {
                            "id": result.user.id,
                            "email": result.user.email,
                            "user_metadata": result.user.user_metadata,
                        },
                        "session": {
                            "access_token": result.session.access_token,
                            "refresh_token": result.session.refresh_token,
                        },
                    },
                    "message": "Login successful",
                }
            )
        else:
            raise Exception("Login failed")

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"success": False, "error": "Invalid credentials"}), 401


def logout():
    """Logout user"""
    try:
        # Note: Token-based logout is handled on the client side
        # Server doesn't need to do anything except validate the request
        return jsonify({"success": True, "message": "Logout successful"})
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def get_current_user(current_user):
    """Get current authenticated user info"""
    return jsonify({"success": True, "data": current_user})


# Voice recognition routes
def recognize_voice():
    """Voice recognition endpoint"""
    try:
        # Check if audio file is in request
        if "audio" not in request.files:
            raise BadRequest("No audio file provided")

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            raise BadRequest("No file selected")

        # Get optional language parameter
        language = request.form.get("language", "zh-CN")

        # Save uploaded file
        temp_path = voice_service.save_uploaded_file(audio_file)
        if not temp_path:
            raise BadRequest("Failed to save audio file")

        # Recognize speech
        result = voice_service.recognize_from_file(temp_path, language)

        # Cleanup temp file
        voice_service.cleanup_temp_file(temp_path)

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Voice recognition error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


# Itinerary routes
def generate_itinerary():
    """Generate travel itinerary using AI"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = [
            "destination",
            "start_date",
            "end_date",
            "budget",
            "people_count",
        ]
        for field in required_fields:
            if field not in data:
                raise BadRequest(f"Missing required field: {field}")

        # Generate itinerary
        result = ai_service.generate_itinerary(
            destination=data["destination"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            budget=float(data["budget"]),
            people_count=int(data["people_count"]),
            preferences=data.get("preferences", ""),
        )

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Itinerary generation error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def save_itinerary(current_user):
    """Save itinerary to database (requires authentication)"""
    try:
        data = request.get_json()

        # Get user ID from authenticated user
        user_id = current_user["id"]

        # Prepare itinerary data
        itinerary_data = {
            "user_id": user_id,
            "title": data.get("title", f"Trip to {data.get('destination', 'Unknown')}"),
            "destination": data["destination"],
            "start_date": data["start_date"],
            "end_date": data["end_date"],
            "budget": float(data["budget"]),
            "people_count": int(data["people_count"]),
            "preferences": data.get("preferences", {}),
            "ai_response": data.get("ai_response", {}),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        # Save to Supabase
        response = supabase.table("itineraries").insert(itinerary_data).execute()

        if response.data:
            return jsonify({"success": True, "data": response.data[0]})
        else:
            raise Exception("Failed to save itinerary")

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Save itinerary error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def list_itineraries(current_user):
    """List user's itineraries (requires authentication)"""
    try:
        # Get user ID from authenticated user
        user_id = current_user["id"]

        # Fetch from Supabase
        response = (
            supabase.table("itineraries")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return jsonify({"success": True, "data": response.data})

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"List itineraries error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def get_itinerary(itinerary_id):
    """Get single itinerary"""
    try:
        # Fetch from Supabase
        response = (
            supabase.table("itineraries").select("*").eq("id", itinerary_id).execute()
        )

        if response.data and len(response.data) > 0:
            return jsonify({"success": True, "data": response.data[0]})
        else:
            return jsonify({"success": False, "error": "Itinerary not found"}), 404

    except Exception as e:
        logger.error(f"Get itinerary error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def update_itinerary(current_user, itinerary_id):
    """Update itinerary (requires authentication)"""
    try:
        data = request.get_json()
        user_id = current_user["id"]

        # Verify ownership before updating
        check_response = (
            supabase.table("itineraries")
            .select("user_id")
            .eq("id", itinerary_id)
            .execute()
        )

        if not check_response.data:
            return jsonify({"success": False, "error": "Itinerary not found"}), 404

        if check_response.data[0]["user_id"] != user_id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        # Prepare update data
        update_data = {
            "title": data.get("title"),
            "destination": data.get("destination"),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "budget": data.get("budget"),
            "people_count": data.get("people_count"),
            "preferences": data.get("preferences"),
            "ai_response": data.get("ai_response"),
            "updated_at": datetime.now().isoformat(),
        }

        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        # Update in Supabase
        response = (
            supabase.table("itineraries")
            .update(update_data)
            .eq("id", itinerary_id)
            .execute()
        )

        if response.data:
            return jsonify({"success": True, "data": response.data[0]})
        else:
            raise Exception("Failed to update itinerary")

    except Exception as e:
        logger.error(f"Update itinerary error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def delete_itinerary(current_user, itinerary_id):
    """Delete itinerary (requires authentication)"""
    try:
        # Get user ID from authenticated user
        user_id = current_user["id"]

        # Verify ownership before deleting
        check_response = (
            supabase.table("itineraries")
            .select("user_id")
            .eq("id", itinerary_id)
            .execute()
        )

        if not check_response.data:
            return jsonify({"success": False, "error": "Itinerary not found"}), 404

        if check_response.data[0]["user_id"] != user_id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        # Delete from Supabase
        response = (
            supabase.table("itineraries").delete().eq("id", itinerary_id).execute()
        )  # noqa

        return jsonify({"success": True, "message": "Itinerary deleted successfully"})

    except Exception as e:
        logger.error(f"Delete itinerary error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


# Map routes
def geocode():
    """Geocode address to coordinates"""
    try:
        address = request.args.get("address")
        if not address:
            raise BadRequest("Address is required")

        city = request.args.get("city")
        result = map_service.geocode(address, city)

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Geocode error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def search_poi():
    """Search points of interest"""
    try:
        keywords = request.args.get("keywords")
        if not keywords:
            raise BadRequest("Keywords are required")

        city = request.args.get("city")
        location = request.args.get("location")
        radius = int(request.args.get("radius", 3000))
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))

        result = map_service.search_poi(keywords, city, location, radius, page, limit)

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"POI search error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def get_route():
    """Get route planning"""
    try:
        origin = request.args.get("origin")
        destination = request.args.get("destination")

        if not origin or not destination:
            raise BadRequest("Origin and destination are required")

        mode = request.args.get("mode", "driving")
        result = map_service.get_route(origin, destination, mode)

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Route planning error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def get_weather():
    """Get weather information"""
    try:
        city = request.args.get("city")
        if not city:
            raise BadRequest("City is required")

        result = map_service.get_weather(city)

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Weather query error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


# Expense management routes
def add_expense(current_user: dict):
    """Add a new expense record"""
    try:
        user_id = current_user["id"]
        data = request.get_json()

        # Debug: Log the received data
        logger.info(f"Received expense data: {data}")
        logger.info(f"User ID: {user_id}")

        # Validate required fields
        itinerary_id = data.get("itinerary_id")
        category = data.get("category")
        amount = data.get("amount")

        if not all([itinerary_id, category, amount is not None]):
            raise BadRequest("itinerary_id, category, and amount are required")

        # Create expense
        expense = expense_service.create_expense(
            user_id=user_id,
            itinerary_id=itinerary_id,
            category=category,
            amount=float(amount),
            description=data.get("description"),
            expense_date=data.get("expense_date"),
            location=data.get("location"),
            payment_method=data.get("payment_method"),
            voice_input=data.get("voice_input", False),
        )

        logger.info(f"Expense created: {expense['id']}")
        return jsonify({"success": True, "data": expense})

    except BadRequest as e:
        logger.error(f"BadRequest error creating expense: {e}")
        return jsonify({"success": False, "error": str(e)}), 400
    except ValueError as e:
        logger.error(f"ValueError creating expense: {e}")
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating expense: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error"}), 500


def list_expenses(current_user: dict):
    """List expenses with optional filters"""
    try:
        user_id = current_user["id"]
        itinerary_id = request.args.get("itinerary_id")
        category = request.args.get("category")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Get expenses
        expenses = expense_service.get_expenses(
            user_id=user_id,
            itinerary_id=itinerary_id,
            category=category,
            start_date=start_date,
            end_date=end_date,
        )

        return jsonify({"success": True, "data": expenses})

    except Exception as e:
        logger.error(f"Error listing expenses: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def get_expense(current_user: dict, expense_id: str):
    """Get a single expense by ID"""
    try:
        user_id = current_user["id"]
        expense = expense_service.get_expense_by_id(expense_id, user_id)

        if not expense:
            return jsonify({"success": False, "error": "Expense not found"}), 404

        return jsonify({"success": True, "data": expense})

    except Exception as e:
        logger.error(f"Error getting expense: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def update_expense(current_user: dict, expense_id: str):
    """Update an expense"""
    try:
        user_id = current_user["id"]
        data = request.get_json()

        # Update expense
        expense = expense_service.update_expense(expense_id, user_id, data)

        logger.info(f"Expense updated: {expense_id}")
        return jsonify({"success": True, "data": expense})

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating expense: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def delete_expense(current_user: dict, expense_id: str):
    """Delete an expense"""
    try:
        user_id = current_user["id"]
        expense_service.delete_expense(expense_id, user_id)

        logger.info(f"Expense deleted: {expense_id}")
        return jsonify({"success": True, "message": "Expense deleted"})

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error deleting expense: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def get_expense_stats(current_user: dict):
    """Get expense statistics for an itinerary"""
    try:
        user_id = current_user["id"]
        itinerary_id = request.args.get("itinerary_id")

        if not itinerary_id:
            raise BadRequest("itinerary_id is required")

        # Get statistics
        stats = expense_service.get_expense_statistics(user_id, itinerary_id)

        return jsonify({"success": True, "data": stats})

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error getting expense stats: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def parse_voice_expense():
    """Parse voice text into structured expense data using AI"""
    try:
        data = request.get_json()
        voice_text = data.get("text")

        if not voice_text:
            raise BadRequest("text is required")

        # Parse using AI
        result = ai_expense_analyzer.parse_voice_expense(voice_text)

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error parsing voice expense: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def analyze_budget(current_user: dict):
    """AI-powered budget analysis"""
    try:
        user_id = current_user["id"]
        data = request.get_json()

        itinerary_id = data.get("itinerary_id")
        if not itinerary_id:
            raise BadRequest("itinerary_id is required")

        # Get itinerary data
        itinerary_response = (
            supabase.table("itineraries")
            .select("*")
            .eq("id", itinerary_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not itinerary_response.data or len(itinerary_response.data) == 0:
            return jsonify({"success": False, "error": "Itinerary not found"}), 404

        itinerary = itinerary_response.data[0]

        # Get expenses
        expenses = expense_service.get_expenses(user_id, itinerary_id)

        # Extract budget breakdown from ai_response
        ai_response = itinerary.get("ai_response", {})
        budget_breakdown = ai_response.get("budget_breakdown", {})
        total_budget = itinerary.get("budget", 0)
        destination = itinerary.get("destination", "")

        # Calculate remaining days (simplified, you may want to improve this)
        from datetime import datetime

        end_date_str = itinerary.get("end_date")
        remaining_days = 0
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
                today = datetime.now()
                remaining_days = max(0, (end_date - today).days)
            except:
                pass

        # Analyze budget
        result = ai_expense_analyzer.analyze_budget(
            expenses=expenses,
            budget_breakdown=budget_breakdown,
            total_budget=total_budget,
            destination=destination,
            remaining_days=remaining_days,
        )

        return jsonify(result)

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error analyzing budget: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def register_routes(app):
    """Register all blueprints with the app"""
    # Create authentication blueprint
    auth_api = Blueprint("auth", __name__)
    auth_api.route("/register", methods=["POST"])(register)
    auth_api.route("/login", methods=["POST"])(login)
    auth_api.route("/logout", methods=["POST"])(logout)
    auth_api.route("/me", methods=["GET"])(require_auth(get_current_user))

    # Create voice API blueprint
    voice_api = Blueprint("voice", __name__)
    voice_api.route("/recognize", methods=["POST"])(recognize_voice)
    voice_api.route("/transcribe", methods=["POST"])(
        recognize_voice
    )  # 添加transcribe别名

    # Create itinerary API blueprint
    itinerary_api = Blueprint("itinerary", __name__)
    itinerary_api.route("/generate", methods=["POST"])(generate_itinerary)
    itinerary_api.route("/save", methods=["POST"])(require_auth(save_itinerary))
    itinerary_api.route("/list", methods=["GET"])(require_auth(list_itineraries))
    itinerary_api.route("/<itinerary_id>", methods=["GET"])(get_itinerary)
    itinerary_api.route("/<itinerary_id>", methods=["PUT"])(
        require_auth(update_itinerary)
    )
    itinerary_api.route("/<itinerary_id>", methods=["DELETE"])(
        require_auth(delete_itinerary)
    )

    # Create map API blueprint
    map_api = Blueprint("map", __name__)
    map_api.route("/geocode", methods=["GET"])(geocode)
    map_api.route("/search", methods=["GET"])(search_poi)
    map_api.route("/route", methods=["GET"])(get_route)
    map_api.route("/weather", methods=["GET"])(get_weather)

    # Create expense API blueprint
    expense_api = Blueprint("expenses", __name__)
    expense_api.route("/add", methods=["POST"])(require_auth(add_expense))
    expense_api.route("/list", methods=["GET"])(require_auth(list_expenses))
    expense_api.route("/<expense_id>", methods=["GET"])(require_auth(get_expense))
    expense_api.route("/<expense_id>", methods=["PUT"])(require_auth(update_expense))
    expense_api.route("/<expense_id>", methods=["DELETE"])(require_auth(delete_expense))
    expense_api.route("/stats", methods=["GET"])(require_auth(get_expense_stats))
    expense_api.route("/voice-parse", methods=["POST"])(parse_voice_expense)
    expense_api.route("/ai-analysis", methods=["POST"])(require_auth(analyze_budget))

    # Create main API blueprint and register all sub-blueprints
    main_api = Blueprint("api", __name__, url_prefix="/api")
    main_api.route("/health", methods=["GET"])(health_check)
    main_api.register_blueprint(auth_api, url_prefix="/auth")
    main_api.register_blueprint(voice_api, url_prefix="/voice")
    main_api.register_blueprint(itinerary_api, url_prefix="/itinerary")
    main_api.register_blueprint(map_api, url_prefix="/map")
    main_api.register_blueprint(expense_api, url_prefix="/expenses")

    # Register main blueprint with app
    app.register_blueprint(main_api)

    logger.info("API routes registered successfully")
