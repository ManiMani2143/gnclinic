import React from 'react';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  Bell, 
  BarChart3,
  Stethoscope,
  Settings,
  LogOut,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  notificationCount: number;
  currentUser: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeSection, 
  onSectionChange, 
  notificationCount,
  currentUser,
  onLogout
}) => {
  // Base menu items available to all users
  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'customers', label: 'Patients', icon: Users },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
  ];
  
  // Admin-only menu items
  const adminMenuItems = [
    { id: 'medicines', label: 'Medicines', icon: Package },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  
  // Salesman additional items
  const salesmanMenuItems = [
    { id: 'medicines', label: 'Medicines', icon: Package },
  ];
  
  // Combine menu items based on user role
  const menuItems = [
    ...baseMenuItems,
    ...(currentUser.role === 'admin' ? adminMenuItems : salesmanMenuItems)
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ClinicPro</h1>
              <p className="text-sm text-gray-600">Management System</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 p-1 rounded-full">
                {currentUser.role === 'admin' ? (
                  <Shield className="h-4 w-4 text-blue-600" />
                ) : (
                  <UserIcon className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">{currentUser.name}</p>
                <p className="text-xs text-blue-700 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'notifications' && notificationCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 capitalize">
              {activeSection === 'customers' ? 'Patients' : 
               activeSection === 'users' ? 'User Management' : activeSection}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.name}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                currentUser.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {currentUser.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <UserIcon className="h-3 w-3 mr-1" />}
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};