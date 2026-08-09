// src/app/dashboard/attendees/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Loader2,
  AlertCircle,
  Church,
  MapPin,
  CreditCard,
  ChevronDown,
  Save,
  XCircle,
  Hash
} from 'lucide-react';

// ==================== Types ====================
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

interface AttendeeData {
  _id: string;
  unique_id: string;
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

// ==================== Constants ====================
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

// ==================== Component ====================
export default function EditAttendeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    attendees, 
    getById,
    update: updateAttendee, 
    error, 
    clearError,
    isLoading: attendeeLoading 
  } = useAttendee();

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    gender: 'Male',
    email: '',
    phone: '',
    local_church: '',
    region: '',
    campus: '',
    payment_status: 'pending',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);

  // ==================== Auth Check ====================
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ==================== Fetch Attendee Data ====================
  useEffect(() => {
    if (id) {
      getById(id);
    }
  }, [id, getById]);

  // ==================== Populate Form ====================
  useEffect(() => {
    // Find the attendee in the store
    const attendee = attendees.find(a => a._id === id) as AttendeeData | undefined;
    
    if (attendee) {
      setAttendeeData(attendee);
      setFormData({
        first_name: attendee.first_name || '',
        last_name: attendee.last_name || '',
        gender: attendee.gender || 'Male',
        email: attendee.email || '',
        phone: attendee.phone || '',
        local_church: attendee.local_church || '',
        region: attendee.region || '',
        campus: attendee.campus || '',
        payment_status: attendee.payment_status || 'pending',
      });
      setIsLoading(false);
    } else if (!attendeeLoading && !attendee) {
      toast.error('Attendee not found');
      router.push('/dashboard/attendees');
    }
  }, [attendees, id, attendeeLoading, router]);

  // ==================== Clear Error ====================
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  // ==================== Validation ====================
  const validateField = useCallback((field: keyof FormData, value: string): string => {
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
        return value.trim() ? '' : 'Campus or university is required';
      default:
        return '';
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const fieldError = validateField(field, formData[field]);
      if (fieldError) {
        newErrors[field] = fieldError;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  // ==================== Handlers ====================
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    if (errors[field]) {
      const fieldError = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: fieldError || undefined }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, formData[field]);
    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Partial<Record<keyof FormData, boolean>> = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error('Please resolve validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateAttendee(id, formData);

      if (result) {
        toast.success(`Attendee ${result.first_name} ${result.last_name} updated successfully!`);
        router.push('/dashboard/attendees');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update attendee';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(val => val.toString().trim() !== '');
  };

  // ==================== Loading States ====================
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-slate-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading attendee details...</p>
        </div>
      </div>
    );
  }

  // ==================== Not Found ====================
  if (!isLoading && !attendeeData && !attendees.find(a => a._id === id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Attendee Not Found</h3>
          <p className="text-sm text-slate-500 mt-1">The attendee you&apos;re looking for doesn&apos;t exist.</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => router.push('/dashboard/attendees')}
          >
            Back to Attendees
          </Button>
        </div>
      </div>
    );
  }

  // ==================== Render ====================
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Attendee</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500">
              Update details for {formData.first_name} {formData.last_name}
            </p>
            {attendeeData?.unique_id && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                <Hash className="h-3 w-3" />
                {attendeeData.unique_id}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100/80 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Attendees
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information */}
            <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Personal Details</h2>
                  <p className="text-xs text-slate-500">Update contact and identity information.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Abebe"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    onBlur={() => handleBlur('first_name')}
                    className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                      errors.first_name && touched.first_name
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                        : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                    } text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all`}
                  />
                  {errors.first_name && touched.first_name && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.first_name}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bikila"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    onBlur={() => handleBlur('last_name')}
                    className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                      errors.last_name && touched.last_name
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                        : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                    } text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all`}
                  />
                  {errors.last_name && touched.last_name && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.last_name}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white text-slate-900 focus:outline-hidden transition-all appearance-none pr-9"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors.email && touched.email
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                          : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                      } text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+251 912 345 678"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors.phone && touched.phone
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                          : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                      } text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Church & Affiliation */}
            <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <Church className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Affiliation & Location</h2>
                  <p className="text-xs text-slate-500">Local church and educational affiliation.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Local Church */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Local Church <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Church name"
                      value={formData.local_church}
                      onChange={(e) => handleChange('local_church', e.target.value)}
                      onBlur={() => handleBlur('local_church')}
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors.local_church && touched.local_church
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                          : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                      } text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all`}
                    />
                  </div>
                  {errors.local_church && touched.local_church && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.local_church}
                    </p>
                  )}
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <select
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      onBlur={() => handleBlur('region')}
                      className={`w-full pl-9 pr-9 py-2.5 text-xs font-medium rounded-xl border ${
                        errors.region && touched.region
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                          : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                      } text-slate-900 focus:outline-hidden transition-all appearance-none`}
                    >
                      <option value="">Select region</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.region && touched.region && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.region}
                    </p>
                  )}
                </div>

                {/* Campus / University */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Campus / University <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Addis Ababa University"
                      value={formData.campus}
                      onChange={(e) => handleChange('campus', e.target.value)}
                      onBlur={() => handleBlur('campus')}
                      className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors.campus && touched.campus
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10'
                          : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white'
                      } text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all`}
                    />
                  </div>
                  {errors.campus && touched.campus && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.campus}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Payment Status Card */}
            <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Payment Status</h3>
                  <p className="text-xs text-slate-500">Update payment record.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={formData.payment_status}
                    onChange={(e) => handleChange('payment_status', e.target.value as 'pending' | 'partial' | 'completed')}
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:ring-slate-900/10 focus:border-slate-800 bg-white text-slate-900 focus:outline-hidden transition-all appearance-none pr-9"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50/80 rounded-xl border border-amber-200/60">
                <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Payment status can be updated as needed.
                </p>
              </div>
            </Card>

            {/* Attendee Summary */}
            <Card className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
                Attendee Overview
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                    {formData.first_name || formData.last_name
                      ? `${formData.first_name} ${formData.last_name}`.trim()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-semibold text-slate-900">
                    {formData.gender}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Region</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                    {formData.region || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Church</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                    {formData.local_church || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Payment</span>
                  <Badge variant={
                    formData.payment_status === 'completed' ? 'success' :
                    formData.payment_status === 'partial' ? 'warning' : 'default'
                  } className="capitalize font-semibold text-[10px]">
                    {formData.payment_status}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Submission Actions */}
            <div className="space-y-2.5">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Record...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Update Attendee
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full py-2.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100/80 text-slate-700 transition-all"
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