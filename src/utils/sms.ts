// SMS Service for sending bills to customers
export interface SMSConfig {
  apiKey: string;
  senderId: string;
  templateId: string;
  enabled: boolean;
}

export interface BillSMSData {
  customerName: string;
  customerPhone: string;
  billNumber: string;
  totalAmount: number;
  clinicName: string;
  clinicPhone: string;
}

// Mock SMS service - Replace with actual SMS provider (Twilio, TextLocal, etc.)
class SMSService {
  private config: SMSConfig;

  constructor() {
    // Load SMS configuration from localStorage or use defaults
    const savedConfig = localStorage.getItem('sms_config');
    this.config = savedConfig ? JSON.parse(savedConfig) : {
      apiKey: '',
      senderId: 'CLINIC',
      templateId: '',
      enabled: false
    };
  }

  updateConfig(config: SMSConfig) {
    this.config = config;
    localStorage.setItem('sms_config', JSON.stringify(config));
  }

  getConfig(): SMSConfig {
    return { ...this.config };
  }

  async sendBillSMS(data: BillSMSData): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: 'SMS service is disabled' };
    }

    if (!this.config.apiKey) {
      return { success: false, message: 'SMS API key not configured' };
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(data.customerPhone.replace(/\D/g, '').slice(-10))) {
      return { success: false, message: 'Invalid phone number format' };
    }

    try {
      // Format the SMS message
      const message = this.formatBillMessage(data);
      
      // For demo purposes, we'll simulate SMS sending
      // In production, replace this with actual SMS API call
      console.log('Sending SMS:', {
        to: data.customerPhone,
        message: message,
        senderId: this.config.senderId
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, we'll always return success
      // In production, handle actual API response
      return {
        success: true,
        message: `SMS sent successfully to ${data.customerPhone}`
      };

    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        message: 'Failed to send SMS. Please try again.'
      };
    }
  }

  private formatBillMessage(data: BillSMSData): string {
    return `Dear ${data.customerName},
Thank you for visiting ${data.clinicName}!

Bill No: ${data.billNumber}
Amount: ₹${data.totalAmount.toFixed(2)}

For queries, call: ${data.clinicPhone}

Get well soon!
- ${data.clinicName}`;
  }

  // Method to send custom SMS
  async sendCustomSMS(phone: string, message: string): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: 'SMS service is disabled' };
    }

    try {
      console.log('Sending custom SMS:', { to: phone, message });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `SMS sent successfully to ${phone}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send SMS'
      };
    }
  }
}

export const smsService = new SMSService();

// Integration instructions for popular SMS providers:

/*
TWILIO INTEGRATION:
1. Install: npm install twilio
2. Replace the mock sendBillSMS with:

import twilio from 'twilio';
const client = twilio(accountSid, authToken);

async sendBillSMS(data: BillSMSData) {
  try {
    const message = await client.messages.create({
      body: this.formatBillMessage(data),
      from: this.config.senderId,
      to: `+91${data.customerPhone}`
    });
    return { success: true, message: `SMS sent: ${message.sid}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

TEXTLOCAL INTEGRATION:
const response = await fetch('https://api.textlocal.in/send/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    apikey: this.config.apiKey,
    numbers: data.customerPhone,
    message: this.formatBillMessage(data),
    sender: this.config.senderId
  })
});

MSG91 INTEGRATION:
const response = await fetch(`https://api.msg91.com/api/sendhttp.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sender: this.config.senderId,
    route: 4,
    country: 91,
    sms: [{
      message: this.formatBillMessage(data),
      to: [data.customerPhone]
    }]
  })
});
*/