'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';

interface Group {
  _id: string;
  name: string;
  description?: string;
  manager?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  parentGroup?: {
    _id: string;
    name: string;
  };
  members: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  }>;
  childGroups: string[];
  isActive: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
}

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdate: () => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  group,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    parentGroupId: ''
  });
  
  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // All users and groups for editing
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEditFormData({
        name: group.name,
        description: group.description || '',
        managerId: group.manager?._id || '',
        parentGroupId: group.parentGroup?._id || ''
      });
      setError(null);
      setSuccessMessage(null);
      fetchAllUsersAndGroups();
    }
  }, [isOpen, group]);

  useEffect(() => {
    if (userSearchQuery) {
      const filtered = availableUsers.filter(user =>
        !group.members.some(member => member._id === user._id) &&
        (user.firstName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
         user.lastName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
         user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
         user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers.filter(user => 
        !group.members.some(member => member._id === user._id)
      ));
    }
  }, [userSearchQuery, availableUsers, group.members]);

  const fetchAllUsersAndGroups = async () => {
    try {
      // Fetch all users
      const usersResponse = await api.get('/groups/users');
      const users = usersResponse.data || [];
      setAllUsers(users);
      setAvailableUsers(users);
      
      // Fetch all groups
      const groupsResponse = await api.get('/groups?limit=100');
      setAllGroups(groupsResponse.data.groups || []);
    } catch (err) {
      console.error('Error fetching users and groups:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, string> = {
        name: editFormData.name,
        description: editFormData.description
      };

      if (editFormData.managerId) {
        payload.managerId = editFormData.managerId;
      }

      if (editFormData.parentGroupId) {
        payload.parentGroupId = editFormData.parentGroupId;
      }

      await api.put(`/groups/${group._id}`, payload);
      setSuccessMessage('Group updated successfully');
      onUpdate();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

    try {
      await api.post(`/groups/${group._id}/members`, { userId: selectedUserId });
      setSuccessMessage('Member added successfully');
      onUpdate();
      setShowAddMember(false);
      setSelectedUserId('');
      setUserSearchQuery('');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      setLoading(true);
      setError(null);

      try {
        await api.delete(`/groups/${group._id}/members/${userId}`);
        setSuccessMessage('Member removed successfully');
        onUpdate();
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to remove member');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Group Details: {group.name}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/50 dark:border-green-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/50 dark:border-red-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'members'
                ? 'text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Members ({group.members.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={loading}
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manager
                </label>
                <select
                  value={editFormData.managerId}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, managerId: e.target.value }))}
                  disabled={loading}
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
                >
                  <option value="">No manager</option>
                  {allUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Group
              </label>
              <select
                value={editFormData.parentGroupId}
                onChange={(e) => setEditFormData(prev => ({ ...prev, parentGroupId: e.target.value }))}
                disabled={loading}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
              >
                <option value="">No parent group</option>
                {allGroups.filter(g => g._id !== group._id).map((grp) => (
                  <option key={grp._id} value={grp._id}>
                    {grp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created at: {new Date(group.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !editFormData.name.trim()}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Group'
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Group Members
              </h3>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
              >
                Add Member
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {group.members.length > 0 ? (
                group.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {member.username}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No members in this group yet
                </div>
              )}
            </div>

            {/* Add Member Section */}
            {showAddMember && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Add New Member</h4>
                
                <div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-1">
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => setSelectedUserId(user._id)}
                          className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedUserId === user._id ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/30' : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              checked={selectedUserId === user._id}
                              onChange={() => setSelectedUserId(user._id)}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.username} - {user.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      {userSearchQuery ? 'No users found matching your search' : 'No available users to add'}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setSelectedUserId('');
                      setUserSearchQuery('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || loading}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add Member'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}; 