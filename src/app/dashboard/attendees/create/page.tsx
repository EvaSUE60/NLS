// src/app/dashboard/attendees/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAttendee } from '@/src/hooks/useAttendee';
import { useAuth } from '@/src/hooks/useAuth';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  Church,
  MapPin,
  UserCheck,
  CreditCard
} from 'lucide-react';

interface FormData {
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female';
  email: string;
  phone: string;
  local_church: string;
  region: string;
  campus: string;
  payment_status: 'pending' | 'partial' | 'completed';
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  gender: 'Male',
  email: '',
  phone: '',
  local_church: '',
  region: '',
  campus: '',
  payment_status: 'pending',
};

// Regions from your data
const regions = [
  'Central 1',
  'Central 2',
  'North',
  'North East',
  'North West',
  'South 1',
  'South 2',
  'South West',
  'West',
  'East'
];

export default function CreateAttendeePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { create: createAttendee, isLoading, error, clearError } = useAttendee();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Clear errors when form changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData]);

  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case 'first_name':
        return value.trim() ? '' : 'First name is required';
      case 'last_name':
        return value.trim() ? '' : 'Last name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email format';
      case 'phone':
        return value.trim() ? '' : 'Phone number is required';
      case 'local_church':
        return value.trim() ? '' : 'Local church is required';
      case 'region':
        return value ? '' : 'Region is required';
      case 'campus':
        return value.trim() ? '' : 'Campus/University is required';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear error for this field
    const error = validateField(field, value);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof FormData, boolean>> = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const attendeeData = {
        ...formData,
        payment_status: formData.payment_status,
      };

      const result = await createAttendee(attendeeData);

      if (result) {
        toast.success(`Attendee ${result.first_name} ${result.last_name} created successfully!`);
        router.push('/dashboard/attendees');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create attendee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return Object.values(formData).every(val => val.toString().trim() !== '');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create New Attendee</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new attendee to the event</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ==================== MAIN FORM ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    onBlur={() => handleBlur('first_name')}
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.first_name && touched.first_name
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                  />
                  {errors.first_name && touched.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    onBlur={() => handleBlur('last_name')}
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.last_name && touched.last_name
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                  />
                  {errors.last_name && touched.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.email && touched.email
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.phone && touched.phone
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Church & Affiliation */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Church className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Church & Affiliation</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Local Church <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter local church name"
                      value={formData.local_church}
                      onChange={(e) => handleChange('local_church', e.target.value)}
                      onBlur={() => handleBlur('local_church')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.local_church && touched.local_church
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                    />
                  </div>
                  {errors.local_church && touched.local_church && (
                    <p className="mt-1 text-sm text-red-600">{errors.local_church}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      onBlur={() => handleBlur('region')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.region && touched.region
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:border-transparent transition bg-white appearance-none`}
                    >
                      <option value="">Select region</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  {errors.region && touched.region && (
                    <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Campus / University <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter campus or university name"
                      value={formData.campus}
                      onChange={(e) => handleChange('campus', e.target.value)}
                      onBlur={() => handleBlur('campus')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.campus && touched.campus
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                    />
                  </div>
                  {errors.campus && touched.campus && (
                    <p className="mt-1 text-sm text-red-600">{errors.campus}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ==================== SIDEBAR ==================== */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Status */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Payment</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Status
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => handleChange('payment_status', e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Payment status can be updated later
                </p>
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-6 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Registration Summary
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">
                    {formData.first_name || formData.last_name
                      ? `${formData.first_name} ${formData.last_name}`.trim()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gender</span>
                  <span className="font-medium text-gray-800">
                    {formData.gender || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Region</span>
                  <span className="font-medium text-gray-800">
                    {formData.region || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Church</span>
                  <span className="font-medium text-gray-800 truncate max-w-[120px]">
                    {formData.local_church || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <Badge variant={
                    formData.payment_status === 'completed' ? 'success' :
                      formData.payment_status === 'partial' ? 'warning' : 'default'
                  }>
                    {formData.payment_status}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Create Attendee
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}