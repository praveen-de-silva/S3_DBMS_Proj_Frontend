import React, { useState } from 'react';
import axios from 'axios';

interface CustomerFormData {
  first_name: string;
  last_name: string;
  nic: string;
  gender: string;
  date_of_birth: string;
  contact_no_1: string;
  contact_no_2: string;
  address: string;
  email: string;
}

interface FormErrors {
  [key: string]: string;
}

const CustomerRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    nic: '',
    gender: 'Male',
    date_of_birth: '',
    contact_no_1: '',
    contact_no_2: '',
    address: '',
    email: ''
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }
    
    if (!formData.nic.trim()) {
      newErrors.nic = 'NIC is required';
    } else if (!/^[0-9]{9}[VvXx]?$|^[0-9]{12}$/.test(formData.nic)) {
      newErrors.nic = 'Please enter a valid NIC number (9 digits with V/X or 12 digits)';
    }
    
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.date_of_birth = 'Customer must be at least 18 years old';
      }
    }
    
    if (!formData.contact_no_1.trim()) {
      newErrors.contact_no_1 = 'Primary contact number is required';
    } else if (!/^[0-9+]{10,15}$/.test(formData.contact_no_1)) {
      newErrors.contact_no_1 = 'Please enter a valid contact number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/agent/customers/register', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`Customer "${formData.first_name} ${formData.last_name}" registered successfully! Customer ID: ${response.data.customer_id}`);
      setFormData({
        first_name: '',
        last_name: '',
        nic: '',
        gender: 'Male',
        date_of_birth: '',
        contact_no_1: '',
        contact_no_2: '',
        address: '',
        email: ''
      });
      setErrors({});
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to register customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const calculateAge = (dateString: string): number => {
    const dob = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="customer-registration">
      <div className="section-header">
        <div>
          <h4>Customer Registration</h4>
          <p className="section-subtitle">Register new customers for banking services</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          {successMessage}
          <button 
            className="close-btn"
            onClick={() => setSuccessMessage('')}
          >
            ×
          </button>
        </div>
      )}

      <div className="registration-form-container">
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Personal Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                  className={errors.first_name ? 'error' : ''}
                />
                {errors.first_name && <span className="error-text">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                  className={errors.last_name ? 'error' : ''}
                />
                {errors.last_name && <span className="error-text">{errors.last_name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>NIC Number *</label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 123456789V or 123456789012"
                  className={errors.nic ? 'error' : ''}
                />
                {errors.nic && <span className="error-text">{errors.nic}</span>}
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                className={errors.date_of_birth ? 'error' : ''}
              />
              {errors.date_of_birth && <span className="error-text">{errors.date_of_birth}</span>}
              {formData.date_of_birth && !errors.date_of_birth && (
                <small className="form-help">
                  Age: {calculateAge(formData.date_of_birth)} years
                </small>
              )}
            </div>
          </div>

          <div className="form-section">
            <h4>Contact Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Primary Contact Number *</label>
                <input
                  type="text"
                  name="contact_no_1"
                  value={formData.contact_no_1}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., +94112345678"
                  className={errors.contact_no_1 ? 'error' : ''}
                />
                {errors.contact_no_1 && <span className="error-text">{errors.contact_no_1}</span>}
              </div>

              <div className="form-group">
                <label>Secondary Contact Number</label>
                <input
                  type="text"
                  name="contact_no_2"
                  value={formData.contact_no_2}
                  onChange={handleInputChange}
                  placeholder="e.g., +94112345679"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="e.g., customer@email.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="e.g., 123 Main Street, Colombo 01"
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  first_name: '',
                  last_name: '',
                  nic: '',
                  gender: 'Male',
                  date_of_birth: '',
                  contact_no_1: '',
                  contact_no_2: '',
                  address: '',
                  email: ''
                });
                setErrors({});
              }}
            >
              Clear Form
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Registering Customer...
                </>
              ) : (
                'Register Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegistration;