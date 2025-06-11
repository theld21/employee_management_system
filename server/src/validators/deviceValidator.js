// Custom validation for device data
const validateDevice = (data) => {
  const errors = [];

  // Validate code
  if (!data.code || typeof data.code !== "string") {
    errors.push("Device code is required");
  } else {
    const formattedCode = data.code.trim().toUpperCase();
    if (formattedCode.length < 2) {
      errors.push("Device code must be at least 2 characters long");
    } else if (formattedCode.length > 50) {
      errors.push("Device code must not exceed 50 characters");
    }
    data.code = formattedCode;
  }

  // Validate typeCode
  if (!data.typeCode || typeof data.typeCode !== "string") {
    errors.push("Type code is required");
  } else {
    const formattedTypeCode = data.typeCode.trim().toUpperCase();
    if (formattedTypeCode.length < 2) {
      errors.push("Type code must be at least 2 characters long");
    } else if (formattedTypeCode.length > 50) {
      errors.push("Type code must not exceed 50 characters");
    }
    data.typeCode = formattedTypeCode;
  }

  // Validate description
  if (!data.description || typeof data.description !== "string") {
    errors.push("Description is required");
  } else {
    const formattedDescription = data.description.trim();
    if (formattedDescription.length < 1) {
      errors.push("Description cannot be empty");
    } else if (formattedDescription.length > 500) {
      errors.push("Description must not exceed 500 characters");
    }
    data.description = formattedDescription;
  }

  // Validate note (optional)
  if (data.note && typeof data.note === "string") {
    const formattedNote = data.note.trim();
    if (formattedNote.length > 1000) {
      errors.push("Note must not exceed 1000 characters");
    }
    data.note = formattedNote;
  } else {
    data.note = "";
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
};

module.exports = {
  validateDevice,
};
