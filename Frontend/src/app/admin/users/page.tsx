"use client";

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import toast from 'react-hot-toast';
import { getAdminUser, adminFetch, type AdminPayload } from '@/lib/adminAuth';

const adminFetcher = (url: string) => adminFetch(url).then((res) => res.json());

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  plainPassword?: string;
}

const emptyUser: Partial<User> = {
  username: '',
  email: '',
  role: 'user',
  avatarUrl: '',
};

export default function UsersPage() {
  const [adminUser, setAdminUser] = useState<AdminPayload | null>(null);

  useEffect(() => {
    setAdminUser(getAdminUser());
  }, []);

  const canFetch = adminUser !== null && (adminUser.role === 'super_admin' || adminUser.role === 'admin');
  const { data, error } = useSWR(canFetch ? '/api/admin/users' : null, adminFetcher);
  const users: User[] = data?.users || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>(emptyUser);

  const openModal = (user?: User) => {
    setFormData(user ? { ...user } : { ...emptyUser });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(emptyUser);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, password, ...rest } = formData;
    try {
      if (_id) {
        await adminFetch(`/api/admin/users/${_id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...rest }),
        });
        if (password) {
          await adminFetch(`/api/admin/users/${_id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password }),
          });
        }
        toast.success('User updated');
      } else {
        await adminFetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({ ...rest, password: password || 'default123' }),
        });
        toast.success('User created');
      }
      mutate('/api/admin/users');
      closeModal();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    toast.success('User deleted');
    mutate('/api/admin/users');
  };

  if (!adminUser || !canFetch) {
    return <div className="text-gray-600 p-6">Loading Users Panel...</div>;
  }

  if (error) return <div className="text-red-500 p-6">Failed to load users</div>;
  if (!data) return <div className="text-gray-650 p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Users Management</h1>
      <button
        className="mb-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
        onClick={() => openModal()}
      >
        Add New User
      </button>
      <table className="w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Avatar</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t">
              <td className="px-4 py-2">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300" />
                )}
              </td>
              <td className="px-4 py-2">{u.username}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2"><span className="capitalize">{u.role}</span></td>
              <td className="px-4 py-2 space-x-2">
                <button
                  className="px-2 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                  onClick={() => openModal(u)}
                >Edit</button>
                <button
                  className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                  onClick={() => handleDelete(u._id)}
                >Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm w-96 p-6">
            <h2 className="text-xl font-semibold mb-4">{formData._id ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="w-full border rounded px-3 py-2"
                value={formData.username || ''}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full border rounded px-3 py-2"
                value={formData.email || ''}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password (leave blank to keep unchanged)"
                className="w-full border rounded px-3 py-2"
                value={formData.password || ''}
                onChange={handleChange}
              />
              <select
                name="role"
                className="w-full border rounded px-3 py-2"
                value={formData.role || 'user'}
                onChange={handleChange}
              >
                <option value="user">User / Kunde</option>
                <option value="editor">Editor</option>
              </select>
              <input
                type="text"
                name="avatarUrl"
                placeholder="Avatar URL"
                className="w-full border rounded px-3 py-2"
                value={formData.avatarUrl || ''}
                onChange={handleChange}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                  onClick={closeModal}
                >Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                >Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
