'use client'

export interface UserRole {
  type: 'estimator' | 'pm' | 'viewer'
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canExport: boolean
    canViewCosts: boolean
    canApprove: boolean
    canCreateProjects: boolean
    canManageUsers: boolean
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  company: string
  avatar?: string
  lastLogin?: Date
  isActive: boolean
}

export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateRole: (userId: string, newRole: UserRole['type']) => Promise<void>
}

// Role definitions with specific permissions
export const ROLES: Record<UserRole['type'], UserRole> = {
  estimator: {
    type: 'estimator',
    permissions: {
      canEdit: true,
      canDelete: true,
      canExport: true,
      canViewCosts: true,
      canApprove: true,
      canCreateProjects: true,
      canManageUsers: false
    }
  },
  pm: {
    type: 'pm',
    permissions: {
      canEdit: true,
      canDelete: false,
      canExport: true,
      canViewCosts: true,
      canApprove: true,
      canCreateProjects: true,
      canManageUsers: true
    }
  },
  viewer: {
    type: 'viewer',
    permissions: {
      canEdit: false,
      canDelete: false,
      canExport: false,
      canViewCosts: false,
      canApprove: false,
      canCreateProjects: false,
      canManageUsers: false
    }
  }
}

export class AuthService {
  private static readonly STORAGE_KEY = 'construction_app_user'
  
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userData = localStorage.getItem(this.STORAGE_KEY)
    if (!userData) return null
    
    try {
      return JSON.parse(userData)
    } catch {
      return null
    }
  }
  
  static async login(email: string, password: string): Promise<User> {
    // In a real app, this would make an API call
    // For demo purposes, we'll simulate authentication
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    
    // Mock users for demo
    const mockUsers: Record<string, Omit<User, 'id'> & { password: string }> = {
      'estimator@company.com': {
        email: 'estimator@company.com',
        password: 'password123',
        name: 'John Estimator',
        role: ROLES.estimator,
        company: 'Elite SD Construction',
        isActive: true,
        lastLogin: new Date()
      },
      'pm@company.com': {
        email: 'pm@company.com',
        password: 'password123',
        name: 'Sarah Manager',
        role: ROLES.pm,
        company: 'Elite SD Construction',
        isActive: true,
        lastLogin: new Date()
      },
      'viewer@company.com': {
        email: 'viewer@company.com',
        password: 'password123',
        name: 'Mike Viewer',
        role: ROLES.viewer,
        company: 'Elite SD Construction',
        isActive: true,
        lastLogin: new Date()
      }
    }
    
    const userData = mockUsers[email]
    if (!userData || userData.password !== password) {
      throw new Error('Invalid credentials')
    }
    
    const user: User = {
      id: Date.now().toString(),
      ...userData
    }
    delete (user as any).password
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    return user
  }
  
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
  
  static async updateUserRole(userId: string, newRoleType: UserRole['type']): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || !currentUser.role.permissions.canManageUsers) {
      throw new Error('Insufficient permissions to manage users')
    }
    
    // In a real app, this would make an API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For demo purposes, update current user if it's the same ID
    if (currentUser.id === userId) {
      const updatedUser = {
        ...currentUser,
        role: ROLES[newRoleType]
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser))
    }
  }
  
  static hasPermission(user: User | null, permission: keyof UserRole['permissions']): boolean {
    return user?.role.permissions[permission] || false
  }
  
  static canAccessResource(user: User | null, resourceOwner: string): boolean {
    if (!user) return false
    
    // Estimators and PMs can access all resources
    if (user.role.type === 'estimator' || user.role.type === 'pm') {
      return true
    }
    
    // Viewers can only access resources they own or public resources
    return user.id === resourceOwner
  }
}

// Permission checking hooks and utilities
export function usePermissions(user: User | null) {
  return {
    canEdit: AuthService.hasPermission(user, 'canEdit'),
    canDelete: AuthService.hasPermission(user, 'canDelete'),
    canExport: AuthService.hasPermission(user, 'canExport'),
    canViewCosts: AuthService.hasPermission(user, 'canViewCosts'),
    canApprove: AuthService.hasPermission(user, 'canApprove'),
    canCreateProjects: AuthService.hasPermission(user, 'canCreateProjects'),
    canManageUsers: AuthService.hasPermission(user, 'canManageUsers'),
    hasPermission: (permission: keyof UserRole['permissions']) =>
      AuthService.hasPermission(user, permission),
    canAccess: (resourceOwner: string) =>
      AuthService.canAccessResource(user, resourceOwner)
  }
}

// Role-based access checker utility
export function checkPermission(user: User | null, permission: keyof UserRole['permissions']): boolean {
  return AuthService.hasPermission(user, permission)
}

// Permission guard for route protection
export function requiresPermission(permission: keyof UserRole['permissions']) {
  return function permissionDecorator(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      const user = AuthService.getCurrentUser()
      if (!AuthService.hasPermission(user, permission)) {
        throw new Error(`Permission denied: ${permission} required`)
      }
      return method.apply(this, args)
    }
  }
}
