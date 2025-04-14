import api from './api';

// This function tests our API configuration in the browser console
export const testApiConfig = () => {
  console.log('API Base URL:', api.defaults.baseURL);
  console.log('Testing API configuration...');
  
  // Check the environment variables
  console.log('Environment variable NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  // Example full URLs that would be called
  console.log('Auth endpoint would be:', `${api.defaults.baseURL}/auth/me`);
  console.log('Attendance endpoint would be:', `${api.defaults.baseURL}/attendance/month?month=3&year=2023`);
  
  return 'API configuration test completed. Check console for results.';
};

export default testApiConfig; 