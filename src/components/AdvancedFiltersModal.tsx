import React, { useState } from 'react';
import { Filter, X, RefreshCw, Search, MapPin, Users, Heart, DollarSign, Briefcase, Activity, Calendar, Home, CheckCircle } from 'lucide-react';
import { mockBeneficiaries } from '../data/mockData';
import { Button, Card, Input, Badge, Modal } from './ui';

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  currentFilters: AdvancedFilters;
}

export interface AdvancedFilters {
  // الفلاتر الجغرافية
  governorate: string;
  city: string;
  district: string;
  
  // الحالة العائلية والاجتماعية
  maritalStatus: string;
  familySize: string;
  ageGroup: string;
  
  // الحالة الاقتصادية والاجتماعية
  economicLevel: string;
  displacementStatus: string;
  profession: string;
  
  // الحالة الصحية
  healthStatus: string;
  
  // فلاتر إضافية
  identityStatus: string;
  eligibilityStatus: string;
  lastReceivedPeriod: string;
  registrationPeriod: string;
}

export const defaultFilters: AdvancedFilters = {
  governorate: 'all',
  city: 'all',
  district: 'all',
  maritalStatus: 'all',
  familySize: 'all',
  ageGroup: 'all',
  economicLevel: 'all',
  displacementStatus: 'all',
  profession: '',
  healthStatus: 'all',
  identityStatus: 'all',
  eligibilityStatus: 'all',
  lastReceivedPeriod: 'all',
  registrationPeriod: 'all'
};

export default function AdvancedFiltersModal({ isOpen, onClose, onApplyFilters, currentFilters }: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(currentFilters);
  const [activeSection, setActiveSection] = useState<string>('geographic');

  // استخراج القيم الفريدة من البيانات الوهمية
  const governorates = [...new Set(mockBeneficiaries.map(b => b.detailedAddress.governorate))].filter(Boolean);
  const cities = [...new Set(mockBeneficiaries
    .filter(b => filters.governorate === 'all' || b.detailedAddress.governorate === filters.governorate)
    .map(b => b.detailedAddress.city))].filter(Boolean);
  const districts = [...new Set(mockBeneficiaries
    .filter(b => 
      (filters.governorate === 'all' || b.detailedAddress.governorate === filters.governorate) &&
      (filters.city === 'all' || b.detailedAddress.city === filters.city)
    )
    .map(b => b.detailedAddress.district))].filter(Boolean);

  const professions = [...new Set(mockBeneficiaries.map(b => b.profession))].filter(Boolean);

  const filterSections = [
    { id: 'geographic', name: 'الفلاتر الجغرافية', icon: MapPin, color: 'blue' },
    { id: 'family', name: 'الحالة العائلية والاجتماعية', icon: Heart, color: 'purple' },
    { id: 'economic', name: 'الحالة الاقتصادية والاجتماعية', icon: DollarSign, color: 'green' },
    { id: 'health', name: 'الحالة الصحية', icon: Activity, color: 'red' },
    { id: 'status', name: 'حالات النظام', icon: CheckCircle, color: 'orange' }
  ];

  const handleFilterChange = (key: keyof AdvancedFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // إعادة تعيين الفلاتر التابعة عند تغيير الفلتر الرئيسي
      if (key === 'governorate') {
        newFilters.city = 'all';
        newFilters.district = 'all';
      } else if (key === 'city') {
        newFilters.district = 'all';
      }
      
      return newFilters;
    });
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== 'all' && value !== '' && value !== defaultFilters[key as keyof AdvancedFilters]
    ).length;
  };

  const getSectionColor = (color: string) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getSectionIconColor = (color: string) => {
    const iconColors = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      red: 'text-red-600',
      orange: 'text-orange-600'
    };
    return iconColors[color as keyof typeof iconColors] || 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="الفلاتر المتقدمة"
      size="xl"
    >
      <div className="p-6">
        {/* Header with Active Filters Count */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Filter className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">تخصيص الفلاتر</h3>
              <p className="text-gray-600">اختر المعايير المناسبة لتصفية المستفيدين</p>
            </div>
          </div>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="info" size="sm">
              {getActiveFiltersCount()} فلتر نشط
            </Badge>
          )}
        </div>

        {/* Filter Sections Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-xl">
          {filterSections.map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? `${getSectionColor(section.color)} border`
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? getSectionIconColor(section.color) : 'text-gray-500'}`} />
                <span>{section.name}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Content */}
        <div className="min-h-[400px]">
          {/* الفلاتر الجغرافية */}
          {activeSection === 'geographic' && (
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-blue-800">الفلاتر الجغرافية</h4>
                  <p className="text-blue-600">تصفية حسب الموقع الجغرافي للمستفيدين</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-3">المحافظة</label>
                  <select
                    value={filters.governorate}
                    onChange={(e) => handleFilterChange('governorate', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع المحافظات</option>
                    {governorates.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">{governorates.length} محافظة متاحة</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-3">المدينة / المخيم</label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    disabled={filters.governorate === 'all'}
                  >
                    <option value="all">
                      {filters.governorate === 'all' ? 'اختر المحافظة أولاً' : 'جميع المدن'}
                    </option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">{cities.length} مدينة متاحة</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-3">الحي / المنطقة</label>
                  <select
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    disabled={filters.city === 'all'}
                  >
                    <option value="all">
                      {filters.city === 'all' ? 'اختر المدينة أولاً' : 'جميع الأحياء'}
                    </option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">{districts.length} حي متاح</p>
                </div>
              </div>
            </Card>
          )}

          {/* الحالة العائلية والاجتماعية */}
          {activeSection === 'family' && (
            <Card className="bg-purple-50 border-purple-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-purple-800">الحالة العائلية والاجتماعية</h4>
                  <p className="text-purple-600">تصفية حسب الوضع العائلي والاجتماعي</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-3">الحالة الاجتماعية</label>
                  <select
                    value={filters.maritalStatus}
                    onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="single">أعزب</option>
                    <option value="married">متزوج</option>
                    <option value="divorced">مطلق</option>
                    <option value="widowed">أرمل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-3">حجم الأسرة</label>
                  <select
                    value={filters.familySize}
                    onChange={(e) => handleFilterChange('familySize', e.target.value)}
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع الأحجام</option>
                    <option value="small">صغيرة (1-3 أفراد)</option>
                    <option value="medium">متوسطة (4-6 أفراد)</option>
                    <option value="large">كبيرة (7-10 أفراد)</option>
                    <option value="very_large">كبيرة جداً (أكثر من 10 أفراد)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-3">الفئة العمرية</label>
                  <select
                    value={filters.ageGroup}
                    onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع الأعمار</option>
                    <option value="youth">شباب (18-30 سنة)</option>
                    <option value="adult">بالغين (31-50 سنة)</option>
                    <option value="middle_aged">متوسطي العمر (51-65 سنة)</option>
                    <option value="elderly">كبار السن (أكثر من 65 سنة)</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* الحالة الاقتصادية والاجتماعية */}
          {activeSection === 'economic' && (
            <Card className="bg-green-50 border-green-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="bg-green-100 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-800">الحالة الاقتصادية والاجتماعية</h4>
                  <p className="text-green-600">تصفية حسب الوضع الاقتصادي والمهني</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-3">المستوى الاقتصادي</label>
                  <select
                    value={filters.economicLevel}
                    onChange={(e) => handleFilterChange('economicLevel', e.target.value)}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع المستويات</option>
                    <option value="very_poor">فقير جداً</option>
                    <option value="poor">فقير</option>
                    <option value="moderate">متوسط</option>
                    <option value="good">ميسور</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-3">حالة النزوح</label>
                  <select
                    value={filters.displacementStatus}
                    onChange={(e) => handleFilterChange('displacementStatus', e.target.value)}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="displaced">نازح</option>
                    <option value="resident">مقيم</option>
                    <option value="refugee">لاجئ</option>
                    <option value="returnee">عائد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-3">المهنة</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                    <input
                      type="text"
                      value={filters.profession}
                      onChange={(e) => handleFilterChange('profession', e.target.value)}
                      placeholder="مثال: عامل، طبيب، مدرس..."
                      className="w-full pr-10 pl-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      list="professions-list"
                    />
                    <datalist id="professions-list">
                      {professions.map(profession => (
                        <option key={profession} value={profession} />
                      ))}
                    </datalist>
                  </div>
                  <p className="text-xs text-green-600 mt-1">أو اختر من القائمة المنسدلة</p>
                </div>
              </div>
            </Card>
          )}

          {/* الحالة الصحية */}
          {activeSection === 'health' && (
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="bg-red-100 p-3 rounded-xl">
                  <Activity className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-800">الحالة الصحية</h4>
                  <p className="text-red-600">تصفية حسب الحالة الصحية والاحتياجات الطبية</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-3">الحالة الصحية العامة</label>
                  <select
                    value={filters.healthStatus}
                    onChange={(e) => handleFilterChange('healthStatus', e.target.value)}
                    className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="healthy">سليم</option>
                    <option value="chronic">مرض مزمن</option>
                    <option value="disability">إعاقة</option>
                    <option value="special_needs">احتياجات خاصة</option>
                    <option value="elderly_care">يحتاج رعاية كبار السن</option>
                  </select>
                </div>

                <div className="bg-red-100 p-4 rounded-xl border border-red-200">
                  <h5 className="font-medium text-red-800 mb-3">الحالات الطبية الشائعة</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-700">ضغط الدم:</span>
                      <span className="font-medium text-red-900">
                        {mockBeneficiaries.filter(b => b.medicalConditions?.includes('ضغط الدم')).length} حالة
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">السكري:</span>
                      <span className="font-medium text-red-900">
                        {mockBeneficiaries.filter(b => b.medicalConditions?.includes('السكري')).length} حالة
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">إعاقة حركية:</span>
                      <span className="font-medium text-red-900">
                        {mockBeneficiaries.filter(b => b.medicalConditions?.includes('إعاقة حركية')).length} حالة
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">أنيميا:</span>
                      <span className="font-medium text-red-900">
                        {mockBeneficiaries.filter(b => b.medicalConditions?.includes('أنيميا')).length} حالة
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* حالات النظام */}
          {activeSection === 'status' && (
            <Card className="bg-orange-50 border-orange-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-orange-800">حالات النظام</h4>
                  <p className="text-orange-600">تصفية حسب حالات التوثيق والأهلية في النظام</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-3">حالة التوثيق</label>
                    <select
                      value={filters.identityStatus}
                      onChange={(e) => handleFilterChange('identityStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="verified">موثق</option>
                      <option value="pending">بانتظار التوثيق</option>
                      <option value="rejected">مرفوض التوثيق</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-3">حالة الأهلية</label>
                    <select
                      value={filters.eligibilityStatus}
                      onChange={(e) => handleFilterChange('eligibilityStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="eligible">مؤهل</option>
                      <option value="under_review">تحت المراجعة</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-3">آخر استلام</label>
                    <select
                      value={filters.lastReceivedPeriod}
                      onChange={(e) => handleFilterChange('lastReceivedPeriod', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="all">جميع الفترات</option>
                      <option value="never">لم يستلم أبداً</option>
                      <option value="week">خلال أسبوع</option>
                      <option value="month">خلال شهر</option>
                      <option value="quarter">خلال 3 أشهر</option>
                      <option value="year">خلال سنة</option>
                      <option value="old">أكثر من سنة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-3">فترة التسجيل</label>
                    <select
                      value={filters.registrationPeriod}
                      onChange={(e) => handleFilterChange('registrationPeriod', e.target.value)}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="all">جميع الفترات</option>
                      <option value="today">اليوم</option>
                      <option value="week">هذا الأسبوع</option>
                      <option value="month">هذا الشهر</option>
                      <option value="quarter">هذا الربع</option>
                      <option value="year">هذا العام</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Filter Summary */}
        <Card className="bg-gray-50 border-gray-200 mt-6">
          <h4 className="font-medium text-gray-900 mb-4">ملخص الفلاتر النشطة</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (value === 'all' || value === '' || value === defaultFilters[key as keyof AdvancedFilters]) {
                return null;
              }
              
              const filterLabels: { [key: string]: string } = {
                governorate: 'المحافظة',
                city: 'المدينة',
                district: 'الحي',
                maritalStatus: 'الحالة الاجتماعية',
                familySize: 'حجم الأسرة',
                ageGroup: 'الفئة العمرية',
                economicLevel: 'المستوى الاقتصادي',
                displacementStatus: 'حالة النزوح',
                profession: 'المهنة',
                healthStatus: 'الحالة الصحية',
                identityStatus: 'حالة التوثيق',
                eligibilityStatus: 'حالة الأهلية',
                lastReceivedPeriod: 'آخر استلام',
                registrationPeriod: 'فترة التسجيل'
              };
              
              return (
                <Badge key={key} variant="info" size="sm">
                  {filterLabels[key]}: {value}
                </Badge>
              );
            })}
            {getActiveFiltersCount() === 0 && (
              <span className="text-gray-500 text-sm italic">لا توجد فلاتر نشطة</span>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <div className="flex space-x-3 space-x-reverse">
            <Button
              variant="secondary"
              icon={RefreshCw}
              iconPosition="right"
              onClick={handleResetFilters}
            >
              إعادة تعيين جميع الفلاتر
            </Button>
          </div>
          
          <div className="flex space-x-3 space-x-reverse">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              icon={Filter}
              iconPosition="right"
              onClick={handleApplyFilters}
            >
              تطبيق الفلاتر ({getActiveFiltersCount()})
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200 mt-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-3">إرشادات الفلترة المتقدمة</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>يمكن تطبيق عدة فلاتر في نفس الوقت للحصول على نتائج دقيقة</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>الفلاتر الجغرافية مترابطة (المحافظة → المدينة → الحي)</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>يمكن البحث في المهن بالكتابة أو الاختيار من القائمة</span>
                </li>
                <li className="flex items-start space-x-2 space-x-reverse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>استخدم "إعادة تعيين" لمسح جميع الفلاتر والعودة للعرض الكامل</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}