import React, { useEffect } from "react";
import { Button, Modal, Form, Input, DatePicker, Tag } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import moment from "moment";

const AddExpense = ({
  isExpenseModalVisible,
  handleExpenseCancel,
  onFinish,
  selectedMonth
}) => {
  const [form] = Form.useForm();
  
  // When the modal becomes visible or the month changes, reset the date field
  useEffect(() => {
    if (isExpenseModalVisible && selectedMonth) {
      // Set default date to the first day of the selected month
      const [year, month] = selectedMonth.split('-');
      const defaultDate = moment(`${year}-${month}-01`, "YYYY-MM-DD");
      form.setFieldsValue({ date: defaultDate });
    }
  }, [isExpenseModalVisible, selectedMonth, form]);
  
  // Format the month ID (YYYY-MM) to display name (April 2025)
  const formatMonthName = (monthId) => {
    if (!monthId) return "No month selected";
    try {
      const [year, month] = monthId.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (err) {
      return monthId;
    }
  };
  
  // Function to disable dates outside the selected month
  const disableDatesOutsideMonth = (current) => {
    if (!selectedMonth || !current) return false;
    
    const [year, month] = selectedMonth.split('-');
    const monthStart = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf('month');
    const monthEnd = moment(monthStart).endOf('month');
    
    return current.isBefore(monthStart, 'day') || current.isAfter(monthEnd, 'day');
  };
  return (
    <Modal
      style={{ fontWeight: 600 }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Add Expense</span>
          {selectedMonth && (
            <Tag color="gold" icon={<CalendarOutlined />} style={{ marginLeft: '8px' }}>
              {formatMonthName(selectedMonth)}
            </Tag>
          )}
        </div>
      }
      open={isExpenseModalVisible}
      onCancel={handleExpenseCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onFinish(values, "expense");
          form.resetFields();
        }}
      >
        <Form.Item
          style={{ fontWeight: 600 }}
          label="Name"
          name="name"
          rules={[
            {
              required: true,
              message: "Please enter the name of the transaction",
            },
          ]}
        >
          <Input type="text" className="custome-input" />
        </Form.Item>

        <Form.Item
          style={{ fontWeight: 600 }}
          label="Amount"
          name="amount"
          rules={[
            { required: true, message: "Please enter the expense amount" },
          ]}
        >
          <Input type="number" className="custome-input" />
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Please Select Date!" }]}
          help={selectedMonth ? `Select a date in ${formatMonthName(selectedMonth)}` : 'Select a date'}
        >
          <DatePicker 
            style={{ width: "100%" }} 
            format="DD-MM-YYYY" 
            disabledDate={disableDatesOutsideMonth}
            placeholder={selectedMonth ? `Date in ${formatMonthName(selectedMonth)}` : 'Select date'}
          />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" className="btn reset-balance-btn">
            Add Expense
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddExpense;
