import { api } from '@/lib/api';

export interface Invitation {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  companyId: string;
  departmentId?: string;
  invitedBy: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendInvitationRequest {
  email: string;
  name: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  departmentId?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  invitation?: Invitation;
  invitations?: Invitation[];
}

export interface InvitationDetailsResponse {
  success: boolean;
  message: string;
  invitation?: {
    email: string;
    name: string;
    role: string;
    companyName: string;
    departmentName?: string;
    expiresAt: string;
  };
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
    companyId: string;
    departmentId?: string;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    company?: {
      id: string;
      name: string;
      slug: string;
    };
    department?: {
      id: string;
      name: string;
    };
  };
  token?: string;
}

/**
 * Send invitation to a new member (Admin/HR only)
 */
export const sendInvitation = async (data: SendInvitationRequest): Promise<InvitationResponse> => {
  const response = await api.post('/invitations', data);
  return response.data;
};

/**
 * Get all invitations (Admin/HR only)
 */
export const getAllInvitations = async (): Promise<InvitationResponse> => {
  const response = await api.get('/invitations');
  return response.data;
};

/**
 * Cancel an invitation (Admin/HR only)
 */
export const cancelInvitation = async (invitationId: string): Promise<InvitationResponse> => {
  const response = await api.delete(`/invitations/${invitationId}`);
  return response.data;
};

/**
 * Get invitation details by token (Public)
 */
export const getInvitationDetails = async (token: string): Promise<InvitationDetailsResponse> => {
  const response = await api.get(`/invitations/details/${token}`);
  return response.data;
};

/**
 * Accept an invitation (Public)
 */
export const acceptInvitation = async (data: AcceptInvitationRequest): Promise<AcceptInvitationResponse> => {
  const response = await api.post('/invitations/accept', data);
  return response.data;
};