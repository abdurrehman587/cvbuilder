#!/usr/bin/env ruby

# Standalone PDF generation test (without Rails)
require 'prawn'
require 'prawn/table'

puts "Testing standalone PDF generation..."

# Sample CV data
sample_cv_data = {
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phones: [{ phone: "+1-555-0123" }, { phone: "+1-555-0456" }],
    address: "123 Main Street, City, State 12345",
    profilePicture: nil,
    summary: "Experienced software developer with 5+ years of experience in web development, mobile applications, and cloud technologies. Passionate about creating efficient, scalable solutions and leading development teams."
  },
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of Technology",
      year: "2018",
      grade: "3.8 GPA"
    }
  ],
  experience: [
    {
      jobTitle: "Senior Software Developer",
      company: "Tech Solutions Inc.",
      duration: "2021 - Present",
      description: "Lead development of web applications using React, Node.js, and AWS. Managed a team of 3 developers and implemented CI/CD pipelines."
    }
  ],
  skills: [
    { skill: "JavaScript" },
    { skill: "React" },
    { skill: "Node.js" },
    { skill: "Python" },
    { skill: "AWS" }
  ],
  languages: [
    { language: "English", languageLevel: "Native" },
    { language: "Spanish", languageLevel: "Fluent" }
  ],
  hobbies: [
    { hobby: "Photography" },
    { hobby: "Hiking" }
  ],
  certifications: [
    "AWS Certified Solutions Architect",
    "Google Cloud Professional Developer"
  ],
  references: [
    "References available upon request"
  ],
  template: "modern"
}

begin
  # Create PDF with A4 page size
  pdf = Prawn::Document.new(
    page_size: 'A4',
    page_layout: :portrait,
    margin: [20, 20, 20, 20]
  )
  
  # Set default font
  pdf.font "Helvetica"
  
  # Generate modern template (Template 2)
  puts "Generating modern template PDF..."
  
  # Create two-column layout
  left_column_width = pdf.bounds.width * 0.35
  right_column_width = pdf.bounds.width * 0.65
  column_gap = 10
  
  # Left sidebar (35% width)
  pdf.bounding_box([0, pdf.cursor], width: left_column_width) do
    # Contact Information in sidebar
    pdf.font_size 12 do
      pdf.text "CONTACT", style: :bold, color: "8B4513"
    end
    pdf.stroke_color "8B4513"
    pdf.line_width 2
    pdf.stroke_horizontal_rule
    pdf.stroke_color "000000"
    pdf.line_width 1
    pdf.move_down 8
    
    # Contact details
    if sample_cv_data[:personalInfo][:phones] && sample_cv_data[:personalInfo][:phones].any?
      phones = sample_cv_data[:personalInfo][:phones].map { |p| p.is_a?(Hash) ? p[:phone] : p }.join(", ")
      pdf.font_size 10 do
        pdf.text "Phone: #{phones}"
      end
      pdf.move_down 5
    end
    
    if sample_cv_data[:personalInfo][:email]
      pdf.font_size 10 do
        pdf.text "Email: #{sample_cv_data[:personalInfo][:email]}"
      end
      pdf.move_down 5
    end
    
    if sample_cv_data[:personalInfo][:address]
      pdf.font_size 10 do
        pdf.text "Address: #{sample_cv_data[:personalInfo][:address]}"
      end
      pdf.move_down 5
    end
    
    pdf.move_down 15
    
    # Skills in sidebar
    if sample_cv_data[:skills] && sample_cv_data[:skills].any?
      pdf.font_size 12 do
        pdf.text "SKILLS", style: :bold, color: "8B4513"
      end
      pdf.stroke_color "8B4513"
      pdf.line_width 2
      pdf.stroke_horizontal_rule
      pdf.stroke_color "000000"
      pdf.line_width 1
      pdf.move_down 8
      
      sample_cv_data[:skills].each do |skill|
        skill_text = skill.is_a?(Hash) ? skill[:skill] : skill
        pdf.font_size 10 do
          pdf.text "• #{skill_text}"
        end
        pdf.move_down 3
      end
      pdf.move_down 15
    end
  end
  
  # Right main content (65% width)
  pdf.bounding_box([left_column_width + column_gap, pdf.cursor], width: right_column_width) do
    # Header section
    pdf.font_size 20 do
      pdf.text sample_cv_data[:personalInfo][:fullName] || "Your Name", 
               style: :bold, 
               color: "8B4513",
               align: :right
    end
    
    pdf.move_down 20
    
    # Professional Summary
    if sample_cv_data[:personalInfo][:summary] && !sample_cv_data[:personalInfo][:summary].empty?
      pdf.font_size 14 do
        pdf.text "PROFESSIONAL SUMMARY", 
                 style: :bold, 
                 color: "8B4513"
      end
      pdf.stroke_color "8B4513"
      pdf.line_width 2
      pdf.stroke_horizontal_rule
      pdf.stroke_color "000000"
      pdf.line_width 1
      pdf.move_down 8
      pdf.font_size 11 do
        pdf.text sample_cv_data[:personalInfo][:summary], align: :justify
      end
      pdf.move_down 15
    end
    
    # Work Experience
    if sample_cv_data[:experience] && sample_cv_data[:experience].any?
      pdf.font_size 14 do
        pdf.text "WORK EXPERIENCE", 
                 style: :bold, 
                 color: "8B4513"
      end
      pdf.stroke_color "8B4513"
      pdf.line_width 2
      pdf.stroke_horizontal_rule
      pdf.stroke_color "000000"
      pdf.line_width 1
      pdf.move_down 8
      
      sample_cv_data[:experience].each do |exp|
        pdf.font_size 12 do
          pdf.text exp[:jobTitle] || "", style: :bold, color: "8B4513"
        end
        pdf.font_size 11 do
          pdf.text "#{exp[:company] || ""} - #{exp[:duration] || ""}"
          if exp[:description] && !exp[:description].empty?
            pdf.move_down 5
            pdf.text exp[:description], align: :justify
          end
        end
        pdf.move_down 10
      end
      pdf.move_down 15
    end
    
    # Education
    if sample_cv_data[:education] && sample_cv_data[:education].any?
      pdf.font_size 14 do
        pdf.text "EDUCATION", 
                 style: :bold, 
                 color: "8B4513"
      end
      pdf.stroke_color "8B4513"
      pdf.line_width 2
      pdf.stroke_horizontal_rule
      pdf.stroke_color "000000"
      pdf.line_width 1
      pdf.move_down 8
      
      sample_cv_data[:education].each do |edu|
        pdf.font_size 12 do
          pdf.text edu[:degree] || "", style: :bold, color: "8B4513"
        end
        pdf.font_size 11 do
          pdf.text "#{edu[:institution] || ""} - #{edu[:year] || ""}"
          if edu[:grade] && !edu[:grade].empty?
            pdf.text "Grade: #{edu[:grade]}"
          end
        end
        pdf.move_down 8
      end
      pdf.move_down 15
    end
  end
  
  # Save PDF to file
  filename = "test_cv_standalone_#{Time.now.strftime('%Y%m%d_%H%M%S')}.pdf"
  pdf.render_file(filename)
  
  puts "✅ PDF generated successfully: #{filename}"
  puts "File size: #{File.size(filename)} bytes"
  puts "File location: #{File.expand_path(filename)}"
  
rescue => e
  puts "❌ Error generating PDF: #{e.message}"
  puts e.backtrace.first(5)
end
