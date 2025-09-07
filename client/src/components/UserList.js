import React from 'react';
import { User, Circle } from 'lucide-react';

const UserList = ({ users, currentUser }) => {
  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-800 mb-4">Online Users</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center space-x-3 p-2 rounded-lg ${
              user.id === currentUser.id 
                ? 'bg-blue-100 text-blue-800' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <Circle className="w-3 h-3 text-green-500 absolute -bottom-1 -right-1 fill-current" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {user.username}
                {user.id === currentUser.id && ' (You)'}
              </div>
              <div className="text-xs text-gray-500">
                {user.currentRoom ? `In #${user.currentRoom}` : 'Available'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;