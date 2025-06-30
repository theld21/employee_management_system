import React from 'react';

interface InputFieldProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
      <input
        type={type}
      value={value}
      onChange={handleChange}
        placeholder={placeholder}
      required={required}
      className={`w-full rounded-lg border border-gray-300 bg-transparent p-2 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white ${className}`}
    />
  );
};

export default InputField;
