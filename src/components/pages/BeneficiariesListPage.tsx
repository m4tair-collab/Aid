import React, { useState } from 'react';
import { Users, Search, Filter, Plus, Eye, Edit, Phone, MessageSquare, CheckCircle, Clock, AlertTriangle, Star, UserCheck, Download, UserPlus, X } from 'lucide-react';
import { type Beneficiary, type SystemUser } from '../../data/mockData';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { useAuth } from '../../context/AuthContext';
import BeneficiaryProfileModal from '../BeneficiaryProfileModal';
import BeneficiaryForm from '../BeneficiaryForm';
import { Button, Card, Input, Badge, StatCard, Modal } from '../ui';
import AdvancedFiltersModal, { type AdvancedFilters, defaultFilters } from '../AdvancedFiltersModal';

interface BeneficiariesListPageProps {
  onNavigateToIndividualSend?: (beneficiaryId: string) => void;
}

export default function BeneficiariesListPage({ onNavigateToIndividualSend }: BeneficiariesListPageProps) {
  const { loggedInUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'message'>('add');
  
  // استخدام Hook المخصص
  const { 
    beneficiaries, 
    loading, 
    error, 
    statistics, 
    refetch 
  } = useBeneficiaries({
    organizationId: loggedInUser?.associatedType === 'organization' ? loggedInUser.associatedId : undefined,
    familyId: loggedInUser?.associatedType === 'family' ? loggedInUser.associatedId : undefined,
    searchTerm
  });

  // تطبيق الفلاتر المتقدمة على البيانات
  const applyAdvancedFilters = (data: Beneficiary[]) => {
    return data.filter(beneficiary => {
      // الفلاتر الجغرافية
      if (advancedFilters.governorate !== 'all' && beneficiary.detailedAddress.governorate !== advancedFilters.governorate) {
        return false;
      }
      if (advancedFilters.city !== 'all' && beneficiary.detailedAddress.city !== advancedFilters.city) {
        return false;
      }
      if (advancedFilters.district !== 'all' && beneficiary.detailedAddress.district !== advancedFilters.district) {
        return false;
      }

      // الحالة العائلية والاجتماعية
      if (advancedFilters.maritalStatus !== 'all' && beneficiary.maritalStatus !== advancedFilters.maritalStatus) {
        return false;
      }
      
      // حجم الأسرة
      if (advancedFilters.familySize !== 'all') {
        const familySize = beneficiary.membersCount;
        switch (advancedFilters.familySize) {
          case 'small':
            if (familySize > 3) return false;
            break;
          case 'medium':
            if (familySize < 4 || familySize > 6) return false;
            break;
          case 'large':
            if (familySize < 7 || familySize > 10) return false;
            break;
          case 'very_large':
            if (familySize <= 10) return false;
            break;
        }
      }

      // الفئة العمرية
      if (advancedFilters.ageGroup !== 'all') {
        const birthDate = new Date(beneficiary.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        switch (advancedFilters.ageGroup) {
          case 'youth':
            if (age < 18 || age > 30) return false;
            break;
          case 'adult':
            if (age < 31 || age > 50) return false;
            break;
          case 'middle_aged':
            if (age < 51 || age > 65) return false;
            break;
          case 'elderly':
            if (age <= 65) return false;
            break;
        }
      }

      // المستوى الاقتصادي
      if (advancedFilters.economicLevel !== 'all' && beneficiary.economicLevel !== advancedFilters.economicLevel) {
        return false;
      }

      // المهنة
      if (advancedFilters.profession && !beneficiary.profession.toLowerCase().includes(advancedFilters.profession.toLowerCase())) {
        return false;
      }

      // الحالة الصحية
      if (advancedFilters.healthStatus !== 'all') {
        const hasConditions = beneficiary.medicalConditions && beneficiary.medicalConditions.length > 0;
        switch (advancedFilters.healthStatus) {
          case 'healthy':
            if (hasConditions) return false;
            break;
          case 'chronic':
          case 'disability':
          case 'special_needs':
          case 'elderly_care':
            if (!hasConditions) return false;
            break;
        }
      }

      // حالة التوثيق
      if (advancedFilters.identityStatus !== 'all' && beneficiary.identityStatus !== advancedFilters.identityStatus) {
        return false;
      }

      // حالة الأهلية
      if (advancedFilters.eligibilityStatus !== 'all' && beneficiary.eligibilityStatus !== advancedFilters.eligibilityStatus) {
        return false;
      }

      // آخر استلام
      if (advancedFilters.lastReceivedPeriod !== 'all') {
        const lastReceived = new Date(beneficiary.lastReceived);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastReceived.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (advancedFilters.lastReceivedPeriod) {
          case 'never':
            if (beneficiary.totalPackages > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
          case 'year':
            if (daysDiff > 365) return false;
            break;
          case 'old':
            if (daysDiff <= 365) return false;
            break;
        }
      }

      return true;
    });
  };

  // تطبيق الفلاتر المتقدمة
  const filteredBeneficiariesWithAdvanced = applyAdvancedFilters(beneficiaries);

  const handleApplyAdvancedFilters = (newFilters: AdvancedFilters) => {
    setAdvancedFilters(newFilters);
    
    // حساب عدد الفلاتر النشطة
    const activeCount = Object.entries(newFilters).filter(([key, value]) => 
      value !== 'all' && value !== '' && value !== defaultFilters[key as keyof AdvancedFilters]
    ).length;
    setActiveFiltersCount(activeCount);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters(defaultFilters);
    setActiveFiltersCount(0);
  };

  const handleViewBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDetailsModal(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('edit');
    setShowModal(true);
  };

  const handleSendMessage = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('message');
    setShowModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIdentityColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">البيانات الوهمية محملة ({beneficiaries.length} مستفيد)</span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button variant="success" icon={Download} iconPosition="right">
            تصدير القائمة
          </Button>
          <Button 
            variant="primary"
            icon={Plus}
            iconPosition="right"
            onClick={() => {
              setModalType('add');
              setSelectedBeneficiary(null);
              setShowModal(true);
            }}
          >
            إضافة مستفيد جديد
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Input
              type="text"
              icon={Search}
              iconPosition="right"
              placeholder="البحث في المستفيدين (الاسم، رقم الهوية، الهاتف)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="secondary" 
              icon={Filter} 
              iconPosition="right"
              onClick={() => setShowAdvancedFilters(true)}
            >
              فلترة متقدمة
              {activeFiltersCount > 0 && (
                <Badge variant="info" size="sm" className="mr-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">الفلاتر النشطة ({activeFiltersCount})</span>
                </div>
                <button
                  onClick={handleClearAdvancedFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 space-x-reverse"
                >
                  <X className="w-4 h-4" />
                  <span>مسح الكل</span>
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.entries(advancedFilters).map(([key, value]) => {
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
                    <div key={key} className="flex items-center space-x-1 space-x-reverse bg-white px-3 py-1 rounded-lg border border-blue-300">
                      <span className="text-sm text-blue-700">
                        {filterLabels[key]}: <span className="font-medium">{value}</span>
                      </span>
                      <button
                        onClick={() => {
                          const newFilters = { ...advancedFilters, [key]: defaultFilters[key as keyof AdvancedFilters] };
                          handleApplyAdvancedFilters(newFilters);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 text-sm text-blue-700">
                <span className="font-medium">النتائج: </span>
                <span>{filteredBeneficiariesWithAdvanced.length} من {beneficiaries.length} مستفيد</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Updated Statistics Cards to reflect filtered data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={activeFiltersCount > 0 ? "المستفيدين (مفلتر)" : "إجمالي المستفيدين"}
          value={activeFiltersCount > 0 ? filteredBeneficiariesWithAdvanced.length : statistics.total}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="موثقين"
          value={activeFiltersCount > 0 ? 
            filteredBeneficiariesWithAdvanced.filter(b => b.identityStatus === 'verified').length : 
            statistics.verified}
          icon={Star}
          color="green"
        />

        <StatCard
          title="بانتظار التوثيق"
          value={activeFiltersCount > 0 ? 
            filteredBeneficiariesWithAdvanced.filter(b => b.identityStatus === 'pending').length : 
            statistics.pending}
      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyAdvancedFilters}
        currentFilters={advancedFilters}
      />

      {/* Remove the old search and filters section */}
      {/* 
      <Card>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
              placeholder="البحث في المستفيدين (الاسم، رقم الهوية، الهاتف)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" icon={Filter} iconPosition="right">
            فلترة متقدمة
          </Button>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستفيدين"
          value={statistics.total}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="موثقين"
          value={statistics.verified}
          icon={Shield}
          color="green"
        />

        <StatCard
          title="بانتظار التوثيق"
          value={statistics.pending}
          icon={Clock}
          color="orange"
        />

        <StatCard
          title="مرفوض التوثيق"
          value={statistics.rejected}
          icon={Shield}
          color="red"
        />
      </div>

      {/* Beneficiaries Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">قائمة المستفيدين ({beneficiaries.length})</h3>
            <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">البيانات الوهمية</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستفيد
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الهوية
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنطقة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر استلام
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {beneficiaries.length > 0 ? (
                  beneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg ml-4">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-sm font-medium text-gray-900">{beneficiary.name}</span>
                              {beneficiary.identityStatus === 'verified' && (
                                <Star className="w-4 h-4 text-green-500 fill-green-500" title="موثق" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {beneficiary.detailedAddress?.city || 'غير محدد'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.nationalId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.detailedAddress?.district || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Badge 
                            variant={
                              beneficiary.identityStatus === 'verified' ? 'success' :
                              beneficiary.identityStatus === 'pending' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {beneficiary.identityStatus === 'verified' ? 'موثق' :
                             beneficiary.identityStatus === 'pending' ? 'بانتظار التوثيق' : 'مرفوض التوثيق'}
                          </Badge>
                          <Badge 
                            variant={
                              beneficiary.status === 'active' ? 'success' :
                              beneficiary.status === 'pending' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {beneficiary.status === 'active' ? 'نشط' :
                             beneficiary.status === 'pending' ? 'معلق' : 'متوقف'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.lastReceived ? new Date(beneficiary.lastReceived).toLocaleDateString('en-CA') : 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button 
                            onClick={() => handleViewBeneficiary(beneficiary)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditBeneficiary(beneficiary)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSendMessage(beneficiary)}
                            className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                            title="إرسال رسالة"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCall(beneficiary.phone)}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors" 
                            title="اتصال"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">لا توجد بيانات مستفيدين</p>
                        <p className="text-sm mt-2">
                          {searchTerm ? 'لا توجد نتائج للبحث' : 'لم يتم إضافة أي مستفيدين بعد'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </Card>

      {/* Beneficiary Details Modal */}
      {showDetailsModal && selectedBeneficiary && (
        <BeneficiaryProfileModal
          beneficiary={selectedBeneficiary}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBeneficiary(null);
          }}
          onNavigateToIndividualSend={onNavigateToIndividualSend}
          onEditBeneficiary={handleEditBeneficiary}
        />
      )}

      {/* Add/Edit/Message Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة مستفيد جديد' :
            modalType === 'edit' ? 'تعديل بيانات المستفيد' :
            'إرسال رسالة'
          }
          size="lg"
        >
            <div className="text-center py-12">
              {(modalType === 'add' || modalType === 'edit') ? (
                <BeneficiaryForm
                  beneficiary={modalType === 'edit' ? selectedBeneficiary : null}
                  onSave={() => {
                    refetch();
                    setShowModal(false);
                    setSelectedBeneficiary(null);
                  }}
                  onCancel={() => {
                    setShowModal(false);
                    setSelectedBeneficiary(null);
                  }}
                />
              ) : (
                <>
                  <div className="bg-gray-100 rounded-xl p-8 mb-4">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">نموذج إرسال رسالة</p>
                    <p className="text-sm text-gray-500 mt-2">سيتم تطوير نموذج الرسائل هنا</p>
                  </div>
                  
                  <div className="flex space-x-3 space-x-reverse justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                    >
                      إلغاء
                    </Button>
                    <Button variant="primary">
                      إرسال الرسالة
                    </Button>
                  </div>
                </>
              )}
            </div>
        </Modal>
      )}
    </div>
  );
}