import React from "react";

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  location?: string;
  portfolio?: string;
  summary: string;
  skills: string[];
  education: Array<{ institute: string; degree: string; branch: string; cgpa: number; graduationYear: number }>;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
  experience: Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>;
  certifications?: Array<{ name: string; issuer: string; date: string; link: string }>;
}

export type TemplateId = "classic" | "modern";

interface TemplateProps {
  data: ResumeData;
  isCompact?: boolean;
}

export const ClassicAtsTemplate: React.FC<TemplateProps> = ({ data, isCompact }) => {
  return (
    <div className={`bg-white text-black font-sans h-[1056px] w-[816px] mx-auto box-border overflow-hidden print:w-full print:h-auto print:p-0 ${isCompact ? 'p-4' : 'p-8'}`}>
      {/* Header */}
      <div className={`text-center ${isCompact ? 'mb-4' : 'mb-6'}`}>
        <h1 className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold uppercase tracking-wider mb-1`}>{data.name || "Your Name"}</h1>
        <div className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} text-gray-700 flex flex-wrap justify-center gap-2 mb-2`}>
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
          {(data.email || data.phone) && data.linkedin && <span>|</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {data.github && <span>|</span>}
          {data.github && <span>{data.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className={`${isCompact ? 'mb-3' : 'mb-5'}`}>
          <h2 className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} font-bold uppercase border-b-2 border-black pb-1 mb-2`}>Professional Summary</h2>
          <p className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} leading-relaxed`}>{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className={`${isCompact ? 'mb-3' : 'mb-5'}`}>
          <h2 className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} font-bold uppercase border-b-2 border-black pb-1 mb-2`}>Technical Skills</h2>
          <p className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} leading-relaxed`}>
            <span className="font-semibold">Languages & Tools:</span> {data.skills.join(", ")}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className={`${isCompact ? 'mb-3' : 'mb-5'}`}>
          <h2 className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} font-bold uppercase border-b-2 border-black pb-1 mb-2`}>Professional Experience</h2>
          <div className={`${isCompact ? 'space-y-2' : 'space-y-4'}`}>
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold`}>{exp.role}</h3>
                  <span className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} text-gray-700`}>{exp.startDate} - {exp.endDate}</span>
                </div>
                <div className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} font-semibold italic mb-1.5`}>{exp.company}</div>
                <ul className={`list-disc pl-5 ${isCompact ? 'text-[11px]' : 'text-[13px]'} leading-relaxed space-y-1`}>
                  {exp.description.split('\n').filter(l => l.trim()).map((line, i) => (
                    <li key={i}>{line.replace(/^- /, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className={`${isCompact ? 'mb-3' : 'mb-5'}`}>
          <h2 className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} font-bold uppercase border-b-2 border-black pb-1 mb-2`}>Certifications</h2>
          <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <h3 className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold`}>
                  {cert.name} <span className="font-normal text-gray-700 italic">({cert.issuer})</span>
                </h3>
                <span className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} text-gray-700`}>{cert.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className={`${isCompact ? 'mb-3' : 'mb-5'}`}>
          <h2 className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} font-bold uppercase border-b-2 border-black pb-1 mb-2`}>Projects</h2>
          <div className={`${isCompact ? 'space-y-2' : 'space-y-4'}`}>
            {data.projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold`}>
                    {proj.title} {proj.repoUrl && <span className="font-normal font-mono text-[11px] ml-1">({proj.repoUrl})</span>}
                  </h3>
                </div>
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className={`text-[12px] italic text-gray-700 ${isCompact ? 'mb-1' : 'mb-1.5'}`}>Technologies: {proj.techStack.join(", ")}</div>
                )}
                <ul className={`list-disc pl-5 ${isCompact ? 'text-[11px]' : 'text-[13px]'} leading-relaxed space-y-1`}>
                  {proj.description.split('\n').filter(l => l.trim()).map((line, i) => (
                    <li key={i}>{line.replace(/^- /, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className={`${isCompact ? 'mb-3' : 'mb-5'}`}>
          <h2 className={`${isCompact ? 'text-[12px]' : 'text-[14px]'} font-bold uppercase border-b-2 border-black pb-1 mb-2`}>Education</h2>
          <div className={`${isCompact ? 'space-y-1' : 'space-y-3'}`}>
            {data.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <h3 className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold`}>{edu.institute}</h3>
                  <div className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} italic`}>{edu.degree} in {edu.branch} {edu.cgpa ? `(CGPA: ${edu.cgpa})` : ""}</div>
                </div>
                <div className={`${isCompact ? 'text-[11px]' : 'text-[13px]'}`}>{edu.graduationYear}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ModernTemplate: React.FC<TemplateProps> = ({ data, isCompact }) => {
  return (
    <div className="bg-white text-gray-800 font-sans h-[1056px] w-[816px] mx-auto box-border flex overflow-hidden print:w-full print:h-auto print:p-0">
      
      {/* Sidebar */}
      <div className={`w-[30%] bg-[#f4f4f6] ${isCompact ? 'p-4' : 'p-6'} border-r border-gray-200 h-full`}>
        <h1 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-black text-gray-900 leading-tight mb-2 tracking-tight`}>{data.name || "Your Name"}</h1>
        <div className={`w-10 ${isCompact ? 'h-0.5' : 'h-1'} bg-blue-600 ${isCompact ? 'mb-4' : 'mb-6'}`}></div>

        <div className={`${isCompact ? 'space-y-4' : 'space-y-6'}`}>
          <div>
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</h2>
            <div className={`space-y-2 ${isCompact ? 'text-[11px]' : 'text-[12px]'} font-medium text-gray-700 break-words`}>
              {data.email && <p>{data.email}</p>}
              {data.phone && <p>{data.phone}</p>}
              {data.linkedin && <p className="text-blue-600">{data.linkedin.replace('https://', '')}</p>}
              {data.github && <p className="text-blue-600">{data.github.replace('https://', '')}</p>}
            </div>
          </div>

          {data.skills && data.skills.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map(s => (
                  <span key={s} className={`px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded ${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-wider`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.education && data.education.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Education</h2>
              <div className={`${isCompact ? 'space-y-2' : 'space-y-4'}`}>
                {data.education.map((edu, idx) => (
                  <div key={idx}>
                    <h3 className={`${isCompact ? 'text-[11px]' : 'text-[12px]'} font-bold text-gray-900`}>{edu.degree}</h3>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-gray-500 mt-0.5`}>{edu.branch}</p>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-medium mt-1`}>{edu.institute}</p>
                    <div className={`flex gap-2 ${isCompact ? 'text-[9px]' : 'text-[10px]'} text-gray-400 mt-1`}>
                      <span>{edu.graduationYear}</span>
                      {edu.cgpa && <span>• CGPA: {edu.cgpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Certifications</h2>
              <div className={`${isCompact ? 'space-y-2' : 'space-y-3'}`}>
                {data.certifications.map((cert, idx) => (
                  <div key={idx}>
                    <h3 className={`${isCompact ? 'text-[11px]' : 'text-[12px]'} font-bold text-gray-900 leading-tight`}>{cert.name}</h3>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-gray-500 mt-0.5`}>{cert.issuer}</p>
                    {cert.date && <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-400 mt-1`}>{cert.date}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`w-[70%] ${isCompact ? 'p-4' : 'p-8'} h-full bg-white`}>
        
        {data.summary && (
          <div className={`${isCompact ? 'mb-4' : 'mb-8'}`}>
            <h2 className={`${isCompact ? 'text-[16px]' : 'text-[18px]'} font-black text-gray-900 mb-3 flex items-center gap-2`}>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Profile
            </h2>
            <p className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} leading-relaxed text-gray-600`}>{data.summary}</p>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div className={`${isCompact ? 'mb-4' : 'mb-8'}`}>
            <h2 className={`${isCompact ? 'text-[16px]' : 'text-[18px]'} font-black text-gray-900 mb-4 flex items-center gap-2`}>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Experience
            </h2>
            <div className={`${isCompact ? 'space-y-4' : 'space-y-6'}`}>
              {data.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-gray-100">
                  <div className="absolute w-2 h-2 bg-blue-600 rounded-full -left-[5px] top-1.5"></div>
                  <h3 className={`${isCompact ? 'text-[13px]' : 'text-[14px]'} font-bold text-gray-900`}>{exp.role}</h3>
                  <div className={`flex items-center gap-2 ${isCompact ? 'text-[11px]' : 'text-[12px]'} text-blue-600 font-semibold mb-2`}>
                    <span>{exp.company}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 font-medium">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <ul className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} leading-relaxed text-gray-600 space-y-1.5 list-disc pl-4`}>
                    {exp.description.split('\n').filter(l => l.trim()).map((line, i) => (
                      <li key={i}>{line.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 className={`${isCompact ? 'text-[16px]' : 'text-[18px]'} font-black text-gray-900 mb-4 flex items-center gap-2`}>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Selected Projects
            </h2>
            <div className={`${isCompact ? 'space-y-4' : 'space-y-6'}`}>
              {data.projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`${isCompact ? 'text-[13px]' : 'text-[14px]'} font-bold text-gray-900`}>{proj.title}</h3>
                    {proj.repoUrl && (
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">{proj.repoUrl}</span>
                    )}
                  </div>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <p className={`text-[11px] text-blue-600 font-semibold ${isCompact ? 'mb-1' : 'mb-2'}`}>{proj.techStack.join(" • ")}</p>
                  )}
                  <ul className={`${isCompact ? 'text-[12px]' : 'text-[13px]'} leading-relaxed text-gray-600 space-y-1.5 list-disc pl-4`}>
                    {proj.description.split('\n').filter(l => l.trim()).map((line, i) => (
                      <li key={i}>{line.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
