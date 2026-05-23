import { supabase } from './supabase.js';

// ── Client lead form ──
const clientForm = document.querySelector('#clientForm form');
if (clientForm) {
  clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const inputs = clientForm.querySelectorAll('input, textarea');
    const payload = {
      name: inputs[0].value.trim(),
      company: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      phone: inputs[3].value.trim(),
      roles: inputs[4].value.trim(),
    };

    const submitBtn = clientForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const { error } = await supabase.from('client_leads').insert([payload]);

    if (error) {
      console.error('Client lead insert error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      alert('Something went wrong. Please try again.');
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

    const inputs = engineerForm.querySelectorAll('input, select, textarea');
    // inputs: 0=first_name, 1=last_name, 2=email, 3=phone,
    //         4=primary_skill, 5=years_experience, 6=file, 7=notes

    const submitBtn = engineerForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    let cvUrl = null;

    // Upload CV if a file was selected
    const fileInput = inputs[6];
    const file = fileInput.files[0];

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
        alert('Failed to upload CV. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      cvUrl = urlData.publicUrl;
    }

    const payload = {
      first_name: inputs[0].value.trim(),
      last_name: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      phone: inputs[3].value.trim(),
      primary_skill: inputs[4].value,
      years_experience: inputs[5].value,
      notes: inputs[7].value.trim(),
      cv_url: cvUrl,
    };

    const { error } = await supabase
      .from('engineer_applications')
      .insert([payload]);

    if (error) {
      console.error('Engineer application insert error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit application';
      alert('Something went wrong. Please try again.');
      return;
    }

    document.getElementById('engineerForm').style.display = 'none';
    document.getElementById('engineerSuccess').classList.add('show');
  });
}
