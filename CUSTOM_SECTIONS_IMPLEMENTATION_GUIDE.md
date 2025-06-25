# Custom Sections Implementation Guide

## ✅ **Completed Templates (1-6)**
- ✅ Template1PDF.js - Custom sections added before references
- ✅ Template1Preview.js - Section list and data validation updated
- ✅ Template2PDF.js - Custom sections added before references  
- ✅ Template2Preview.js - Section list and data validation updated
- ✅ Template3PDF.js - Custom sections added before references
- ✅ Template3Preview.js - Section list and data validation updated
- ✅ Template4PDF.js - Custom sections added before references
- ✅ Template4Preview.js - Section list and data validation updated
- ✅ Template5PDF.js - Custom sections added before references
- ✅ Template5Preview.js - Section list and data validation updated
- ✅ Template6PDF.js - Custom sections added before references
- ✅ Template6Preview.js - Section list and data validation updated

## 🔄 **Remaining Templates (7-10)**

### **Template 7-10 PDF Files**
For each of the remaining PDF templates, add this code:

#### **1. Add renderCustomSections function (after renderOtherInformation):**
```javascript
const renderCustomSections = (customSections) => {
  if (!customSections || customSections.length === 0) return null;

  return customSections.map((section, sectionIndex) => {
    if (!section.heading || !section.details || section.details.length === 0) {
      return null;
    }

    return (
      <section key={sectionIndex} style={sectionStyle} aria-label={`${section.heading} Section`}>
        <h2 style={sectionTitleStyle}>{section.heading}</h2>
        <ul style={listStyle}>
          {section.details.map((detail, detailIndex) => (
            <li key={detailIndex} style={listItemStyle}>{detail}</li>
          ))}
        </ul>
      </section>
    );
  });
};
```

#### **2. Add custom sections rendering (before references section):**
```javascript
{/* Custom Sections - rendered before references */}
{visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
  renderCustomSections(formData.customSections)
)}
```

### **Template 7-10 Preview Files**
For each of the remaining preview templates, update:

#### **1. Update sectionList:**
```javascript
const sectionList = [
  { key: 'objective', title: 'Objective' },
  { key: 'education', title: 'Education' },
  { key: 'workExperience', title: 'Work Experience' },
  { key: 'skills', title: 'Skills' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'projects', title: 'Projects' },
  { key: 'languages', title: 'Languages' },
  { key: 'hobbies', title: 'Hobbies' },
  { key: 'customSections', title: 'Custom Sections' },
  { key: 'references', title: 'References' },
  { key: 'otherInformation', title: 'Other Information' },
];
```

#### **2. Update hasSectionData function:**
```javascript
case 'customSections':
  return formData.customSections && formData.customSections.length > 0 &&
         formData.customSections.some(section => 
           section.heading && section.details && section.details.length > 0
         );
```

## 📋 **Files to Update**

### **PDF Templates:**
- `src/Template7PDF.js`
- `src/Template8PDF.js` 
- `src/Template9PDF.js`
- `src/Template10PDF.js`

### **Preview Templates:**
- `src/Template7Preview.js`
- `src/Template8Preview.js`
- `src/Template9Preview.js`
- `src/Template10Preview.js`

## 🎯 **Implementation Steps**

1. **For each PDF template:**
   - Add `renderCustomSections` function after `renderOtherInformation`
   - Add custom sections rendering before references section
   - Update `renderOtherInformation` to use the new format

2. **For each Preview template:**
   - Add `customSections` to `sectionList` before `references`
   - Add `customSections` case to `hasSectionData` function

3. **Test each template:**
   - Add custom sections in the form
   - Verify they appear in preview before references
   - Verify they appear in PDF before references

## 🔧 **Quick Copy-Paste Code**

### **For PDF Templates:**
```javascript
// Add after renderOtherInformation function
const renderCustomSections = (customSections) => {
  if (!customSections || customSections.length === 0) return null;
  return customSections.map((section, sectionIndex) => {
    if (!section.heading || !section.details || section.details.length === 0) return null;
    return (
      <section key={sectionIndex} style={sectionStyle} aria-label={`${section.heading} Section`}>
        <h2 style={sectionTitleStyle}>{section.heading}</h2>
        <ul style={listStyle}>
          {section.details.map((detail, detailIndex) => (
            <li key={detailIndex} style={listItemStyle}>{detail}</li>
          ))}
        </ul>
      </section>
    );
  });
};

// Add before references section
{/* Custom Sections - rendered before references */}
{visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
  renderCustomSections(formData.customSections)
)}
```

### **For Preview Templates:**
```javascript
// Add to sectionList before references
{ key: 'customSections', title: 'Custom Sections' },

// Add to hasSectionData function
case 'customSections':
  return formData.customSections && formData.customSections.length > 0 &&
         formData.customSections.some(section => 
           section.heading && section.details && section.details.length > 0
         );
```

## ✅ **Verification Checklist**

After updating each template:
- [ ] Custom sections appear in preview before references
- [ ] Custom sections appear in PDF before references
- [ ] Section toggle works correctly
- [ ] Empty custom sections don't show
- [ ] Form data is properly saved and loaded

## 🚀 **Next Steps**

1. Update remaining templates (7-10) using the guide above
2. Test all templates with custom sections
3. Push changes to GitHub
4. Verify database function is working correctly

---

**Note:** All templates follow the same pattern. The custom sections will always appear before the references section as requested. 

console.log('Rendering checkedItems:', checkedItems); 