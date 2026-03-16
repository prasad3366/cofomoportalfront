import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { Card, Button } from '../ui/Common';
import { authAPI } from '../../services/apiClient';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

export const ProfileView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await authAPI.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColor: Record<string, string> = {
      'candidate': 'bg-blue-100 text-blue-900 border-blue-300',
      'hr': 'bg-purple-100 text-purple-900 border-purple-300',
      'admin': 'bg-red-100 text-red-900 border-red-300',
    };
    return roleColor[role.toLowerCase()] || 'bg-slate-100 text-slate-900 border-slate-300';
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-500">Loading profile...</p>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Profile</h3>
        <p className="text-slate-500 mb-6">{error || 'Failed to load profile'}</p>
        <Button onClick={loadProfile} variant="primary">
          Retry
        </Button>
      </Card>
    );
  }

  const formattedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative max-w-2xl mx-auto space-y-6">
      {/* decorative background blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-100/50 blur-3xl" />
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-[30px] border border-slate-200 bg-[#eef1f7] p-8 shadow-[18px_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#eef1f7] shadow-[inset_8px_8px_18px_rgba(203,213,225,0.55)]">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-[8px_8px_18px_rgba(15,23,42,0.08)]">
                <User className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900">{profile.name}</h2>
              <p className="text-slate-600 mt-1">{profile.email}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold shadow-[6px_6px_14px_rgba(15,23,42,0.08)]">
                <User className="w-4 h-4 text-slate-700" />
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="rounded-[30px] border border-slate-200 bg-[#eef1f7] p-8 shadow-[18px_18px_36px_rgba(15,23,42,0.08)]">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Details</h3>

          <div className="space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4 rounded-[26px] bg-[#eef1f7] px-5 py-5 shadow-[inset_8px_8px_18px_rgba(203,213,225,0.55)]">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-[8px_8px_16px_rgba(15,23,42,0.08)]">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium">Email Address</p>
                <p className="text-base text-slate-900 mt-1">{profile.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4 rounded-[26px] bg-[#eef1f7] px-5 py-5 shadow-[inset_8px_8px_18px_rgba(203,213,225,0.55)]">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-[8px_8px_16px_rgba(15,23,42,0.08)]">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium">Phone Number</p>
                <p className="text-base text-slate-900 mt-1">{profile.phone}</p>
              </div>
            </div>

            {/* (Role and User ID intentionally hidden) */}

            {/* Created Date */}
            <div className="flex items-start gap-4 rounded-[26px] bg-[#eef1f7] px-5 py-5 shadow-[inset_8px_8px_18px_rgba(203,213,225,0.55)]">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-[8px_8px_16px_rgba(15,23,42,0.08)]">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium">Member Since</p>
                <p className="text-base text-slate-900 mt-1">{formattedDate}</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Refresh Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Button onClick={loadProfile} variant="secondary" className="w-full rounded-[22px] border-none bg-[#eef1f7] shadow-[10px_10px_20px_rgba(15,23,42,0.08)] hover:bg-[#eef1f7]">
          Refresh Profile
        </Button>
      </motion.div>
    </div>
  );
};
