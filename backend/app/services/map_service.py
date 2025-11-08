"""
Map service for integrating with Amap (高德地图) API
"""

from typing import Any, Dict, List

import requests
from loguru import logger

from ..config import Config


class MapService:
    """Service for map-related operations using Amap API"""

    def __init__(self):
        """Initialize the map service"""
        self.api_key = Config.AMAP_API_KEY
        self.base_url = "https://restapi.amap.com/v3"
        logger.info("Map Service initialized with Amap API")

    def geocode(self, address: str, city: str = None) -> Dict[str, Any]:
        """
        Convert address to coordinates (geocoding)

        Args:
            address: Address to geocode
            city: Optional city to narrow down search

        Returns:
            dict: Contains success status and location data
        """
        try:
            url = f"{self.base_url}/geocode/geo"
            params = {
                "key": self.api_key,
                "address": address,
            }

            if city:
                params["city"] = city

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "1" and data["geocodes"]:
                location = data["geocodes"][0]["location"]
                lng, lat = location.split(",")

                result = {
                    "success": True,
                    "location": location,
                    "longitude": float(lng),
                    "latitude": float(lat),
                    "formatted_address": data["geocodes"][0].get(
                        "formatted_address", address
                    ),
                    "province": data["geocodes"][0].get("province", ""),
                    "city": data["geocodes"][0].get("city", ""),
                    "district": data["geocodes"][0].get("district", ""),
                }

                logger.info(f"Geocoded address '{address}' to {location}")
                return result
            else:
                logger.warning(f"Geocoding failed: {data.get('info', 'Unknown error')}")
                return {
                    "success": False,
                    "error": data.get("info", "Address not found"),
                }

        except requests.RequestException as e:
            logger.error(f"Network error in geocoding: {e}")
            return {"success": False, "error": f"Network error: {str(e)}"}

    def reverse_geocode(self, longitude: float, latitude: float) -> Dict[str, Any]:
        """
        Convert coordinates to address (reverse geocoding)

        Args:
            longitude: Longitude
            latitude: Latitude

        Returns:
            dict: Contains success status and address data
        """
        try:
            url = f"{self.base_url}/geocode/regeo"
            params = {
                "key": self.api_key,
                "location": f"{longitude},{latitude}",
                "extensions": "base",
            }

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "1":
                regeocode = data["regeocode"]
                result = {
                    "success": True,
                    "formatted_address": regeocode.get("formatted_address", ""),
                    "province": regeocode["addressComponent"].get("province", ""),
                    "city": regeocode["addressComponent"].get("city", ""),
                    "district": regeocode["addressComponent"].get("district", ""),
                    "street": regeocode["addressComponent"].get("street", ""),
                }

                logger.info(f"Reverse geocoded ({longitude}, {latitude})")
                return result
            else:
                return {
                    "success": False,
                    "error": data.get("info", "Reverse geocoding failed"),
                }

        except requests.RequestException as e:
            logger.error(f"Network error in reverse geocoding: {e}")
            return {"success": False, "error": f"Network error: {str(e)}"}

    def search_poi(
        self,
        keywords: str,
        city: str = None,
        location: str = None,
        radius: int = 3000,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Search for points of interest (POI)

        Args:
            keywords: Search keywords (e.g., "餐厅", "酒店", "景点")
            city: City to search in
            location: Center point for search (longitude,latitude)
            radius: Search radius in meters (when location is provided)
            page: Page number
            limit: Number of results per page

        Returns:
            dict: POI search results
        """
        try:
            url = f"{self.base_url}/place/text"
            params = {
                "key": self.api_key,
                "keywords": keywords,
                "offset": limit,
                "page": page,
                "extensions": "all",
            }

            if city:
                params["city"] = city

            if location:
                params["location"] = location
                params["radius"] = radius

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "1":
                pois = []
                for poi in data.get("pois", []):
                    pois.append(
                        {
                            "name": poi.get("name", ""),
                            "type": poi.get("type", ""),
                            "address": poi.get("address", ""),
                            "location": poi.get("location", ""),
                            "tel": poi.get("tel", ""),
                            "distance": poi.get("distance", ""),
                            "rating": poi.get("biz_ext", {}).get("rating", ""),
                            "cost": poi.get("biz_ext", {}).get("cost", ""),
                        }
                    )

                result = {
                    "success": True,
                    "count": int(data.get("count", 0)),
                    "pois": pois,
                }

                logger.info(f"Found {len(pois)} POIs for '{keywords}'")
                return result
            else:
                return {
                    "success": False,
                    "error": data.get("info", "POI search failed"),
                }

        except requests.RequestException as e:
            logger.error(f"Network error in POI search: {e}")
            return {"success": False, "error": f"Network error: {str(e)}"}

    def get_route(
        self, origin: str, destination: str, mode: str = "driving"
    ) -> Dict[str, Any]:
        """
        Get route planning between two points

        Args:
            origin: Origin location (longitude,latitude)
            destination: Destination location (longitude,latitude)
            mode: Travel mode ('driving', 'walking', 'transit', 'bicycling')

        Returns:
            dict: Route information
        """
        try:
            # Map mode to API endpoint
            mode_map = {
                "driving": "driving",
                "walking": "walking",
                "transit": "transit/integrated",
                "bicycling": "bicycling",
            }

            endpoint = mode_map.get(mode, "driving")
            url = f"{self.base_url}/direction/{endpoint}"

            params = {
                "key": self.api_key,
                "origin": origin,
                "destination": destination,
                "extensions": "base",
            }

            # Add city for transit mode
            if mode == "transit":
                params["city"] = "北京"  # Default city, should be dynamic

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "1" and data.get("route"):
                route_data = data["route"]

                # Extract relevant information based on mode
                if mode == "transit":
                    transits = route_data.get("transits", [])
                    if transits:
                        route = transits[0]
                        result = {
                            "success": True,
                            "distance": float(route.get("distance", 0)),
                            "duration": int(route.get("duration", 0)),
                            "walking_distance": float(route.get("walking_distance", 0)),
                            "cost": float(route.get("cost", 0)),
                            "segments": self._parse_transit_segments(
                                route.get("segments", [])
                            ),
                        }
                    else:
                        result = {"success": False, "error": "No transit route found"}
                else:
                    paths = route_data.get("paths", [])
                    if paths:
                        path = paths[0]
                        result = {
                            "success": True,
                            "distance": float(path.get("distance", 0)),
                            "duration": int(path.get("duration", 0)),
                            "strategy": path.get("strategy", ""),
                            "tolls": float(path.get("tolls", 0)),
                            "steps": len(path.get("steps", [])),
                        }
                    else:
                        result = {"success": False, "error": "No route found"}

                logger.info(f"Route planned from {origin} to {destination} ({mode})")
                return result
            else:
                return {
                    "success": False,
                    "error": data.get("info", "Route planning failed"),
                }

        except requests.RequestException as e:
            logger.error(f"Network error in route planning: {e}")
            return {"success": False, "error": f"Network error: {str(e)}"}

    def _parse_transit_segments(self, segments: List) -> List[Dict]:
        """Parse transit segments for readable format"""
        parsed = []
        for segment in segments:
            if "bus" in segment:
                bus = (
                    segment["bus"]["buslines"][0] if segment["bus"]["buslines"] else {}
                )
                parsed.append(
                    {
                        "type": "bus",
                        "name": bus.get("name", ""),
                        "departure_stop": bus.get("departure_stop", {}).get("name", ""),
                        "arrival_stop": bus.get("arrival_stop", {}).get("name", ""),
                        "duration": bus.get("duration", 0),
                    }
                )
            elif "walking" in segment:
                parsed.append(
                    {
                        "type": "walking",
                        "distance": segment["walking"].get("distance", 0),
                        "duration": segment["walking"].get("duration", 0),
                    }
                )
        return parsed

    def get_weather(self, city: str) -> Dict[str, Any]:
        """
        Get weather information for a city

        Args:
            city: City name or adcode

        Returns:
            dict: Weather information
        """
        try:
            url = f"{self.base_url}/weather/weatherInfo"
            params = {"key": self.api_key, "city": city, "extensions": "base"}

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "1" and data.get("lives"):
                weather = data["lives"][0]
                result = {
                    "success": True,
                    "province": weather.get("province", ""),
                    "city": weather.get("city", ""),
                    "weather": weather.get("weather", ""),
                    "temperature": weather.get("temperature", ""),
                    "winddirection": weather.get("winddirection", ""),
                    "windpower": weather.get("windpower", ""),
                    "humidity": weather.get("humidity", ""),
                    "reporttime": weather.get("reporttime", ""),
                }

                logger.info(f"Got weather for {city}")
                return result
            else:
                return {
                    "success": False,
                    "error": data.get("info", "Weather query failed"),
                }

        except requests.RequestException as e:
            logger.error(f"Network error in weather query: {e}")
            return {"success": False, "error": f"Network error: {str(e)}"}


# Create a singleton instance
map_service = MapService()
