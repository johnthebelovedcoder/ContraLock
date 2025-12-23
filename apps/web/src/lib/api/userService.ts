import { User, KYCVerification, PaymentMethod, PaginatedResponse, FilterParams } from '@/types';
import { apiClient } from './client';

class UserService {
  async getUserById(userId: string): Promise<User> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  }

  async uploadProfilePicture(userId: string, file: File): Promise<User> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await apiClient.put(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // KYC Verification
  async getKYCVerification(userId: string): Promise<KYCVerification> {
    const response = await apiClient.get(`/users/${userId}/kyc`);
    return response.data;
  }

  async submitKYCVerification(
    userId: string,
    kycData: {
      documentType: string;
      documentFront: File;
      documentBack?: File;
      selfie: File;
      addressProof?: File;
    }
  ): Promise<KYCVerification> {
    const formData = new FormData();
    formData.append('documentType', kycData.documentType);
    formData.append('documentFront', kycData.documentFront);
    
    if (kycData.documentBack) {
      formData.append('documentBack', kycData.documentBack);
    }
    
    formData.append('selfie', kycData.selfie);
    
    if (kycData.addressProof) {
      formData.append('addressProof', kycData.addressProof);
    }

    const response = await apiClient.post(`/users/${userId}/kyc`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Payment Methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const response = await apiClient.get(`/users/${userId}/payment-methods`);
    return response.data;
  }

  async addPaymentMethod(
    userId: string,
    paymentMethodData: {
      type: string;
      isDefault?: boolean;
      stripeToken?: string;
      bankAccountData?: any;
      paypalEmail?: string;
    }
  ): Promise<PaymentMethod> {
    const response = await apiClient.post(`/users/${userId}/payment-methods`, paymentMethodData);
    return response.data;
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    paymentMethodData: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    const response = await apiClient.put(
      `/users/${userId}/payment-methods/${paymentMethodId}`,
      paymentMethodData
    );
    return response.data;
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/payment-methods/${paymentMethodId}`);
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentMethod> {
    const response = await apiClient.patch(
      `/users/${userId}/payment-methods/${paymentMethodId}/default`,
      {}
    );
    return response.data;
  }

  // User Search and Filtering
  async searchUsers(
    filters: FilterParams,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      ...filters,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    const response = await apiClient.get(`/users/search?${params.toString()}`);
    return response.data;
  }
}

export const userService = new UserService();