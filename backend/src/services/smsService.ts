import twilio from 'twilio';

/**
 * SMS Service for sending OTPs via Twilio
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: any = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send OTP via SMS
 */
export const sendOTP = async (
  phoneNumber: string,
  otp: string,
  purpose: string = 'verification'
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!twilioClient) {
      console.warn('Twilio client not configured. OTP sending disabled.');
      return {
        success: true,
        messageId: 'mock-' + Date.now().toString(),
        error: undefined
      };
    }

    const message = getOTPMessage(otp, purpose);

    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
};

/**
 * Generate appropriate OTP message based on purpose
 */
const getOTPMessage = (otp: string, purpose: string): string => {
  const baseMessage = `Your Pocket Guard OTP is: ${otp}. Valid for 10 minutes.`;

  switch (purpose) {
    case 'signup':
      return `Welcome to Pocket Guard! ${baseMessage} Do not share this with anyone.`;
    case 'login':
      return `Pocket Guard Login: ${baseMessage}`;
    case '2fa':
      return `Pocket Guard Verification: ${baseMessage}`;
    case 'phone_verification':
      return `Pocket Guard Phone Verification: ${baseMessage}`;
    default:
      return baseMessage;
  }
};

/**
 * Send transactional SMS (non-OTP)
 */
export const sendTransactionalSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!twilioClient) {
      console.warn('Twilio client not configured. SMS sending disabled.');
      return {
        success: true,
        messageId: 'mock-' + Date.now().toString(),
        error: undefined
      };
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
};
