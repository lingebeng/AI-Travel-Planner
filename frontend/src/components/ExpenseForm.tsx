/**
 * Expense Form Component
 * Add/Edit expense with voice input support
 */

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Button,
  Card,
} from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import VoiceExpenseInput from './VoiceExpenseInput';
import { Expense, ExpenseInput, VoiceParseResult } from '../services/expenseService';

const { Option } = Select;
const { TextArea } = Input;

interface ExpenseFormProps {
  initialValues?: Partial<Expense>;
  itineraryId: string;
  onSubmit: (values: ExpenseInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialValues,
  itineraryId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        expense_date: initialValues.expense_date
          ? dayjs(initialValues.expense_date)
          : dayjs(),
      });
    } else {
      form.setFieldsValue({
        expense_date: dayjs(),
      });
    }
  }, [initialValues, form]);

  const handleVoiceParsed = (result: VoiceParseResult) => {
    // Auto-fill form with AI parsed data
    const updates: any = {
      category: result.category,
      amount: result.amount,
    };

    if (result.description) {
      updates.description = result.description;
    }
    if (result.location) {
      updates.location = result.location;
    }
    if (result.payment_method) {
      updates.payment_method = result.payment_method;
    }

    form.setFieldsValue(updates);
  };

  const handleFinish = async (values: any) => {
    const expenseData: ExpenseInput = {
      itinerary_id: itineraryId,
      category: values.category,
      amount: values.amount,
      description: values.description,
      expense_date: values.expense_date
        ? dayjs(values.expense_date).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      location: values.location,
      payment_method: values.payment_method,
      voice_input: false,
    };

    await onSubmit(expenseData);
  };

  return (
    <Card>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Voice Input Button */}
          <div style={{ textAlign: 'center' }}>
            <VoiceExpenseInput onParsed={handleVoiceParsed} disabled={loading} />
            <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              点击录音，说出开销内容，AI 将自动填充表单
            </p>
          </div>

          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select placeholder="选择开销类别" size="large">
              <Option value="交通">🚗 交通</Option>
              <Option value="住宿">🏠 住宿</Option>
              <Option value="餐饮">🍜 餐饮</Option>
              <Option value="景点">🎫 景点</Option>
              <Option value="购物">🛍️ 购物</Option>
              <Option value="其他">📦 其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额（元）"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0, message: '金额不能为负' },
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="0.00"
              precision={2}
              prefix="¥"
            />
          </Form.Item>

          <Form.Item name="description" label="描述（可选）">
            <TextArea rows={2} placeholder="简要描述这笔开销..." />
          </Form.Item>

          <Form.Item name="expense_date" label="日期">
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="location" label="地点（可选）">
            <Input size="large" placeholder="消费地点" />
          </Form.Item>

          <Form.Item name="payment_method" label="支付方式（可选）">
            <Select placeholder="选择支付方式" size="large" allowClear>
              <Option value="现金">💵 现金</Option>
              <Option value="微信">💚 微信</Option>
              <Option value="支付宝">💙 支付宝</Option>
              <Option value="银行卡">💳 银行卡</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                保存
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={onCancel}
                disabled={loading}
                size="large"
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
};

export default ExpenseForm;
