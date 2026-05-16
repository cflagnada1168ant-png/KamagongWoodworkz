document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ocularBookingForm');
  const phoneInput = document.getElementById('contactNumber');
  const dateInput = document.getElementById('preferredDate');
  const alertBar = document.getElementById('formAlertBar');

  // Set up the updated placeholder string format
  phoneInput.setAttribute('placeholder', '+63 9XX XXX XXXX');

  // ==========================================
  // RULE 1: Enforce Strict 1-Week Advance Date Minimum
  // ==========================================
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + 7);

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const minBookingDate = `${yyyy}-${mm}-${dd}`;
  
  dateInput.setAttribute('min', minBookingDate);


  // ==========================================
  // RULE 2: Protect Prefix & Block All Letters
  // ==========================================
  phoneInput.addEventListener('input', (e) => {
    // 1. Ensure the prefix always stays locked at the beginning
    if (!phoneInput.value.startsWith('+63 ')) {
      phoneInput.value = '+63 ';
    }

    // 2. Extract only the typed portion following the "+63 " prefix
    const prefixLength = 4; // Length of "+63 "
    const userTypedPart = phoneInput.value.substring(prefixLength);

    // 3. Strip out any character that is NOT a number instantly
    const cleanNumbersOnly = userTypedPart.replace(/[^0-8]/g, '');

    // 4. Re-combine the locked prefix with the cleaned numeric values
    phoneInput.value = '+63 ' + cleanNumbersOnly;
  });

  phoneInput.addEventListener('keydown', (e) => {
    // Prevent backspacing out the prefix text structure safely
    if (phoneInput.selectionStart <= 4 && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
    }
  });


  // ==========================================
  // Form Submission Validation Guard Checks
  // ==========================================
  form.addEventListener('submit', (event) => {
    let isFormValid = true;
    const inputs = form.querySelectorAll('input, textarea');

    inputs.forEach(input => {
      const formGroup = input.parentElement;
      let isInputValid = true;

      // Check empty values
      if (input.hasAttribute('required') && !input.value.trim()) {
        isInputValid = false;
      } 
      
      // Strict Gmail Verification Rule Engine Check
      else if (input.type === 'email' && input.value.trim()) {
        const emailValue = input.value.trim().toLowerCase();
        if (!emailValue.endsWith('@gmail.com')) {
          isInputValid = false;
        }
      }

      // Complete Phone Length Check (+63 + 10 digits = 14 total string length)
      else if (input.id === 'contactNumber') {
        const rawDigits = input.value.replace('+63 ', '').trim();
        if (rawDigits.length !== 10) {
          isInputValid = false;
        }
      }

      // Apply Class Hook Styles
      if (!isInputValid) {
        formGroup.classList.add('invalid');
        isFormValid = false;
      } else {
        formGroup.classList.remove('invalid');
      }
    });

    if (!isFormValid) {
      event.preventDefault(); 
      alertBar.style.display = 'flex'; 
    } else {
      alertBar.style.display = 'none';
      console.log('Validation passed successfully! Submitting form values...');
    }
  });

  // Dynamically remove error indicators during active typings
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      const formGroup = field.parentElement;
      if (field.value.trim()) {
        formGroup.classList.remove('invalid');
      }
      
      const activeErrors = form.querySelectorAll('.invalid');
      if (activeErrors.length === 0) {
        alertBar.style.display = 'none';
      }
    });
  });
});