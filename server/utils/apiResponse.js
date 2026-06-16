/**
 * Standardized API Response Helper Class
 */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Sends the standardized API response via Express res object
   * @param {Object} res - Express response object
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    });
  }

  /**
   * Helper static method to send a 200 OK response
   */
  static success(res, data, message = 'Operation succeeded', statusCode = 200) {
    return new ApiResponse(statusCode, data, message).send(res);
  }

  /**
   * Helper static method to send a 201 Created response
   */
  static created(res, data, message = 'Resource created successfully') {
    return new ApiResponse(201, data, message).send(res);
  }
}
