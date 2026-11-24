/**
 * Address lines shown on a CV.
 * Both addresses keep their own labels. One address is labeled "Address",
 * including older CVs that only stored `address`.
 */

export function getAddressLines(data) {
  const source = data || {};
  const present = String(source.presentAddress || '').trim();
  const permanent = String(source.permanentAddress || '').trim();
  const legacy = String(source.address || '').trim();

  if (present && permanent) {
    return [
      { key: 'present', label: 'Present Address', value: present },
      { key: 'permanent', label: 'Permanent Address', value: permanent },
    ];
  }

  const only = present || permanent || legacy;
  if (!only) return [];
  return [{ key: 'address', label: 'Address', value: only }];
}

/** Value shown in the Present Address field, including older single-address CVs. */
export function presentAddressInputValue(data) {
  const source = data || {};
  const present = String(source.presentAddress || '');
  const permanent = String(source.permanentAddress || '').trim();
  if (present.trim() || permanent) return present;
  return String(source.address || '');
}

/** Read address inputs when the form is mounted. Returns {} when it is not. */
export function readAddressFieldsFromDom() {
  if (typeof document === 'undefined') return {};

  const presentEl = document.getElementById('present-address-input');
  const permanentEl = document.getElementById('permanent-address-input');
  const legacyEl = document.getElementById('address-input');
  if (!presentEl && !permanentEl && !legacyEl) return {};

  const fields = {};
  if (presentEl) fields.presentAddress = presentEl.value || '';
  if (permanentEl) fields.permanentAddress = permanentEl.value || '';
  if (legacyEl) {
    fields.address = legacyEl.value || '';
  } else if (presentEl || permanentEl) {
    const present = String(fields.presentAddress || '').trim();
    const permanent = String(fields.permanentAddress || '').trim();
    fields.address = present && permanent ? '' : (present || permanent);
  }
  return fields;
}
