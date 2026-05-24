import { supabase } from './supabase.js';

// ── Validation helpers ──

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

const MAX_TEXT = 500;
const MAX_MESSAGE = 2000;
const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'];

function stripEmojis(str) {
  return str.replace(EMOJI_REGEX, '').trim();
}

function hasEmojis(str) {
  return EMOJI_REGEX.test(str);
}

function showError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = '';
    el.classList.remove('show');
  }
}

function validateTextField(value, fieldName, maxLen) {
  if (hasEmojis(value)) {
    return `${fieldName} cannot contain emoji characters. Please remove them and try again.`;
  }
  if (value.length > maxLen) {
    return `${fieldName} is too long (max ${maxLen} characters).`;
  }
  return null;
}

function validateCvFile(file) {
  if (!file) return null; // CV is optional

  const name = file.name.toLowerCase();
  const ext = name.substring(name.lastIndexOf('.'));

  if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
    return 'CV must be a PDF or Word document (.pdf, .doc, or .docx).';
  }

  if (file.type && !ALLOWED_CV_TYPES.includes(file.type)) {
    return 'CV must be a PDF or Word document (.pdf, .doc, or .docx).';
  }

  return null;
}


// ── Client lead form ──
const clientForm = document.querySelector('#clientForm form');
if (clientForm) {
  clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('clientError');

    const inputs = clientForm.querySelectorAll('input, textarea');
    const raw = {
      name: inputs[0].value.trim(),
      company: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      phone: inputs[3].value.trim(),
      roles: inputs[4].value.trim(),
    };

    // Validate all fields
    const checks = [
      validateTextField(raw.name, 'Name', MAX_TEXT),
      validateTextField(raw.company, 'Company', MAX_TEXT),
      validateTextField(raw.email, 'Email', MAX_TEXT),
      validateTextField(raw.phone, 'Phone', MAX_TEXT),
      validateTextField(raw.roles, 'Roles description', MAX_MESSAGE),
    ];

    const firstError = checks.find((err) => err !== null);
    if (firstError) {
      showError('clientError', firstError);
      return;
    }

    // Strip emojis from all fields before sending
    const payload = {
      name: stripEmojis(raw.name),
      company: stripEmojis(raw.company),
      email: stripEmojis(raw.email),
      phone: stripEmojis(raw.phone),
      roles: stripEmojis(raw.roles),
    };

    const submitBtn = clientForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const { error } = await supabase.from('client_leads').insert([payload]);

    if (error) {
      console.error('Client lead insert error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      showError('clientError', 'Something went wrong. Please try again.');
      return;
    }

    document.getElementById('clientForm').style.display = 'none';
    document.getElementById('clientSuccess').classList.add('show');
  });
}


// ── Engineer application form ──
const engineerForm = document.querySelector('#engineerForm form');
if (engineerForm) {
  engineerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('engineerError');

    const inputs = engineerForm.querySelectorAll('input, select, textarea');
    // inputs: 0=first_name, 1=last_name, 2=email, 3=phone,
    //         4=primary_skill, 5=years_experience, 6=file, 7=notes

    const raw = {
      first_name: inputs[0].value.trim(),
      last_name: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      phone: inputs[3].value.trim(),
      primary_skill: inputs[4].value,
      years_experience: inputs[5].value,
      notes: inputs[7].value.trim(),
    };

    // Validate text fields
    const checks = [
      validateTextField(raw.first_name, 'First name', MAX_TEXT),
      validateTextField(raw.last_name, 'Last name', MAX_TEXT),
      validateTextField(raw.email, 'Email', MAX_TEXT),
      validateTextField(raw.phone, 'Phone', MAX_TEXT),
      validateTextField(raw.notes, 'Notes', MAX_MESSAGE),
    ];

    const firstError = checks.find((err) => err !== null);
    if (firstError) {
      showError('engineerError', firstError);
      return;
    }

    // Validate CV file
    const fileInput = inputs[6];
    const file = fileInput.files[0];
    const cvError = validateCvFile(file);
    if (cvError) {
      showError('engineerError', cvError);
      return;
    }

    const submitBtn = engineerForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    let cvUrl = null;

    // Upload CV if a file was selected
    if (file) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${timestamp}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('CV upload error:', uploadError);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit application';
        showError('engineerError', 'Failed to upload CV. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      cvUrl = urlData.publicUrl;
    }

    // Strip emojis from all text fields before sending
    const payload = {
      first_name: stripEmojis(raw.first_name),
      last_name: stripEmojis(raw.last_name),
      email: stripEmojis(raw.email),
      phone: stripEmojis(raw.phone),
      primary_skill: raw.primary_skill,
      years_experience: raw.years_experience,
      notes: stripEmojis(raw.notes),
      cv_url: cvUrl,
    };

    const { error } = await supabase
      .from('engineer_applications')
      .insert([payload]);

    if (error) {
      console.error('Engineer application insert error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit application';
      showError('engineerError', 'Something went wrong. Please try again.');
      return;
    }

    document.getElementById('engineerForm').style.display = 'none';
    document.getElementById('engineerSuccess').classList.add('show');
  });
}
