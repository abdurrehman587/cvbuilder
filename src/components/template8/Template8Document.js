import React from 'react';

function textLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•●▪◦\-\u2022\u25cf\u25e6]+/, '').trim())
    .filter(Boolean);
}

function BulletList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="t8-bullets">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Section({ title, children }) {
  return (
    <section className="t8-section t8-cv-section">
      <h2 className="t8-section-heading">{title}</h2>
      {children}
    </section>
  );
}

function RoleRow({ title, detail, time }) {
  if (!title && !detail && !time) return null;
  return (
    <div className="t8-role">
      <p className="t8-role-main">
        {title ? <span className="t8-role-title">{title}</span> : null}
        {detail ? <span className="t8-role-detail">{title ? ' — ' : ''}{detail}</span> : null}
      </p>
      {time ? <span className="t8-role-time">{time}</span> : null}
    </div>
  );
}

export default function Template8Document({ displayData }) {
  const addressLines = displayData.addressLines || [];
  const addressBits = addressLines.map((line) => (
    addressLines.length === 1 ? line.value : `${line.label}: ${line.value}`
  ));
  const contact = [...addressBits, displayData.phone, displayData.email].filter(Boolean);

  const languages = (displayData.languages || []).map((language) => {
    const name = typeof language === 'string' ? language : (language.name || '');
    const level = typeof language === 'string' ? '' : (language.level || '');
    if (!name) return '';
    return level ? `${name} — ${level}` : name;
  }).filter(Boolean);

  const links = (displayData.otherInfo || []).filter(
    (info) => info && info.value && /^https?:\/\//i.test(String(info.value).trim())
  );
  const otherInfo = (displayData.otherInfo || []).filter(
    (info) => info && info.value && !/^https?:\/\//i.test(String(info.value).trim())
  );

  return (
    <div className="t8-root">
      <header className="t8-header t8-cv-section">
        {displayData.name ? <h1 className="t8-name">{displayData.name}</h1> : null}
        {displayData.position ? <p className="t8-tagline">{displayData.position}</p> : null}
        {contact.length > 0 ? (
          <p className="t8-contact">{contact.join(' | ')}</p>
        ) : null}
      </header>

      {displayData.professionalSummary ? (
        <Section title="Professional Summary">
          <div className="t8-prose">
            {textLines(displayData.professionalSummary).map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </Section>
      ) : null}

      {displayData.skills && displayData.skills.length > 0 ? (
        <Section title="Core Skills">
          <BulletList items={displayData.skills} />
        </Section>
      ) : null}

      {displayData.experience && displayData.experience.length > 0 ? (
        <Section title="Work Experience">
          {displayData.experience.map((exp, index) => (
            <article key={index} className="t8-entry">
              <RoleRow title={exp.jobTitle} detail={exp.company} time={exp.duration} />
              <BulletList items={textLines(exp.jobDetails)} />
            </article>
          ))}
        </Section>
      ) : null}

      {displayData.education && displayData.education.length > 0 ? (
        <Section title="Education">
          {displayData.education.map((edu, index) => {
            const time = [edu.year, edu.marks].filter(Boolean).join(' · ');
            return (
              <article key={index} className="t8-entry">
                <RoleRow title={edu.degree} detail={edu.board} time={time} />
                <BulletList items={textLines(edu.details)} />
              </article>
            );
          })}
        </Section>
      ) : null}

      {languages.length > 0 ? (
        <Section title="Languages">
          <BulletList items={languages} />
        </Section>
      ) : null}

      {displayData.certifications && displayData.certifications.length > 0 ? (
        <Section title="Certifications">
          <BulletList items={displayData.certifications} />
        </Section>
      ) : null}

      {displayData.hobbies && displayData.hobbies.length > 0 ? (
        <Section title="Hobbies">
          <BulletList items={displayData.hobbies} />
        </Section>
      ) : null}

      {links.length > 0 ? (
        <Section title="Links">
          <BulletList items={links.map((info) => (
            info.label && info.label.trim() ? info.label.trim() : info.value.trim()
          ))} />
        </Section>
      ) : null}

      {otherInfo.length > 0 ? (
        <Section title="Other Information">
          {otherInfo.map((info, index) => (
            <RoleRow key={index} title={info.label} detail={info.value} />
          ))}
        </Section>
      ) : null}

      {displayData.customSection && displayData.customSection.length > 0
        ? displayData.customSection.map((custom, sectionIndex) => {
            const details = custom.details || (custom.detail ? [custom.detail] : []);
            const heading = custom.heading || '';
            const subHeading = custom.subHeading || custom.subheading || '';
            const lines = details.flatMap((detail) => textLines(detail));
            if (!heading && !subHeading && lines.length === 0) return null;
            return (
              <Section key={sectionIndex} title={heading || 'Additional Information'}>
                {subHeading ? <p className="t8-subheading">{subHeading}</p> : null}
                <BulletList items={lines} />
              </Section>
            );
          })
        : null}

      {displayData.references && displayData.references.length > 0 ? (
        <Section title="References">
          <div className="t8-prose">
            {displayData.references.map((reference, index) => (
              <p key={index}>{reference}</p>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
