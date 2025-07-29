export class ApiError extends Error {
  public status: number;
  public statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }

  static fromResponse(response: Response): ApiError {
    return new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  static networkError(): ApiError {
    return new ApiError(
      'Network error: Unable to connect to the server',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404:
        return 'The requested resource was not found';
      case 500:
        return 'Internal server error. Please try again later';
      case 0:
        return 'Network error. Please check your connection';
      default:
        return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}; 