# Custom Sections Feature Setup Guide

## Overview
The CV Builder now includes a new "Add more Section" feature that allows users to create custom sections with their own headings and details. This feature provides flexibility for users to add any additional information they want to include in their CV.

## Features

### 1. Custom Section Management
- **Section Heading**: Users can create custom section titles
- **Section Details**: Multiple detail entries per section
- **Add/Remove Sections**: Users can add multiple custom sections
- **Add/Remove Details**: Each section can have multiple detail entries

### 2. User Interface
- Clean, intuitive interface with clear visual separation
- Each section is contained in its own bordered area
- Easy-to-use buttons for adding and removing content
- Responsive design that works on all devices

### 3. Data Persistence
- Custom sections are saved to the database
- Data is properly loaded when editing existing CVs
- Compatible with both regular users and admin users

## Database Setup

### 1. Add Custom Sections Column
Run the following SQL script to add the custom_sections column to your existing database:

```sql
-- Add custom_sections column to the cvs table
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have an empty custom_sections array
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;
```

### 2. Update Admin RPC Function
Run the updated admin RPC function script (`update_admin_rpc_with_custom_sections.sql`) to include custom_sections support:

```sql
-- This will update the admin_update_cv function to include custom_sections parameter
-- See update_admin_rpc_with_custom_sections.sql for the complete script
```

### 3. Update Admin Search Functions
Run the updated admin search functions script (`update_admin_search_functions.sql`) to include custom_sections in search results:

```sql
-- This will update admin_get_all_cvs() and admin_search_cvs() functions
-- See update_admin_search_functions.sql for the complete script
```

## Implementation Details

### Form Data Structure
The custom sections are stored in the form data as:

```javascript
customSections: [
  {
    heading: "Section Title",
    details: ["Detail 1", "Detail 2", "Detail 3"]
  },
  {
    heading: "Another Section",
    details: ["Another detail"]
  }
]
```

### Component Structure
The feature is implemented using the `CustomSectionsSection` component which includes:

- **Section Management**: Add/remove entire sections
- **Detail Management**: Add/remove details within each section
- **Input Validation**: Ensures at least one section and one detail per section
- **Visual Feedback**: Clear styling and disabled states for minimum requirements

### Event Handlers
The following handlers manage the custom sections:

- `handleAddCustomSection()`: Adds a new section
- `handleRemoveCustomSection(sectionIndex)`: Removes a section
- `handleCustomSectionHeadingChange(sectionIndex, value)`: Updates section heading
- `handleCustomSectionDetailChange(sectionIndex, detailIndex, value)`: Updates section detail
- `handleAddCustomSectionDetail(sectionIndex)`: Adds a new detail to a section
- `handleRemoveCustomSectionDetail(sectionIndex, detailIndex)`: Removes a detail from a section

## Usage Instructions

### For Users
1. **Add a New Section**: Click "Add New Section" button
2. **Set Section Heading**: Enter a title for your custom section
3. **Add Details**: Click "Add Detail" to add content to the section
4. **Remove Content**: Use "Remove" buttons to delete sections or details
5. **Save**: Your custom sections will be saved with the rest of your CV

### For Developers
1. **Database Migration**: Run the provided SQL scripts
2. **Component Integration**: The component is already integrated into the form
3. **Data Loading**: Custom sections are automatically loaded when editing CVs
4. **Admin Support**: Admin users can view and edit custom sections for any CV

## File Changes

### Modified Files
- `src/Form.js`: Added custom sections functionality
- `database_setup.sql`: Added custom_sections column
- `final_admin_rpc_function.sql`: Updated to include custom_sections

### New Files
- `add_custom_sections_column.sql`: Database migration script
- `update_admin_rpc_with_custom_sections.sql`: Updated admin RPC function
- `update_admin_search_functions.sql`: Updated admin search functions
- `CUSTOM_SECTIONS_SETUP.md`: This setup guide

## Testing

### Test Cases
1. **Add Custom Section**: Verify new sections can be added
2. **Edit Section Heading**: Verify headings can be modified
3. **Add Section Details**: Verify multiple details can be added
4. **Remove Content**: Verify sections and details can be removed
5. **Save and Load**: Verify data persists after saving and loading
6. **Admin Access**: Verify admin users can access custom sections
7. **Minimum Requirements**: Verify at least one section and detail is required

### Validation
- At least one custom section must exist
- Each section must have at least one detail
- Section headings cannot be empty
- All data is properly saved to the database

## Troubleshooting

### Common Issues
1. **Database Column Missing**: Run the `add_custom_sections_column.sql` script
2. **Admin RPC Errors**: Update the admin RPC function with the new script
3. **Data Not Loading**: Check that the custom_sections column exists and has data
4. **Save Failures**: Verify the database schema matches the expected structure

### Error Messages
- "Column 'custom_sections' does not exist": Run the database migration script
- "Function admin_update_cv does not exist": Update the admin RPC function
- "Invalid JSON": Check that the custom_sections data is properly formatted

## Future Enhancements

### Potential Improvements
1. **Section Templates**: Pre-defined section templates (Awards, Publications, etc.)
2. **Rich Text Editor**: Support for formatted text in section details
3. **Section Ordering**: Allow users to reorder sections
4. **Section Visibility**: Option to show/hide sections in different templates
5. **Import/Export**: Support for importing custom sections from other CVs

## Support

For technical support or questions about the custom sections feature, please refer to:
- Database setup: `database_setup.sql`
- Admin functions: `update_admin_rpc_with_custom_sections.sql`
- Search functions: `update_admin_search_functions.sql`
- Implementation: `src/Form.js` (CustomSectionsSection component) 