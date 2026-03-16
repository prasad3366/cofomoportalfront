import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Code2,
  FileCheck2,
  FileUp,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

const STAGES = [
  {
    step: '01',
    title: 'Resume Shortlisting',
    description: 'Initial screening of the profile, resume quality, and role alignment.',
    icon: FileCheck2,
  },
  {
    step: '02',
    title: 'Technical Interview',
    description: 'Focused technical evaluation of core skills and problem-solving ability.',
    icon: Code2,
  },
  {
    step: '03',
    title: 'HR Interview',
    description: 'Discussion around communication, expectations, and organizational fit.',
    icon: Briefcase,
  },
  {
    step: '04',
    title: 'Upload Documents',
    description: 'Submission of required documents for the next part of the process.',
    icon: FileUp,
  },
  {
    step: '05',
    title: 'Background Verification',
    description: 'Verification of records, details, and supporting information.',
    icon: ShieldCheck,
  },
  {
    step: '06',
    title: 'Offer Letter',
    description: 'Final stage where the selected candidate receives the formal offer.',
    icon: ScrollText,
  },
] as const;

const rowHeight = 176;
const nodeX = 450;
const nodeStart = 88;
const nodeGap = rowHeight;
const nodes = STAGES.map((_, index) => ({
  x: nodeX,
  y: nodeStart + index * nodeGap,
}));

const pathD = nodes
  .map((node, index) => {
    if (index === 0) {
      return `M ${node.x} ${node.y}`;
    }

    const prev = nodes[index - 1];
    const controlOffset = index % 2 === 1 ? -42 : 42;
    const midY = (prev.y + node.y) / 2;

    return `C ${prev.x + controlOffset} ${midY - 34}, ${node.x + controlOffset} ${midY + 34}, ${node.x} ${node.y}`;
  })
  .join(' ');

const safePathD = pathD || 'M0 0';

export const HiringProcessFlow: React.FC = () => {
  return (
    <div className="mx-auto max-w-[980px] px-4 py-8">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef2ff_100%)] px-10 py-10">
        <div className="pointer-events-none absolute -left-12 top-20 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-16 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
            Hiring Journey
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Candidate Hiring Process
          </h2>
        </div>

        <div className="relative mx-auto w-[900px]" style={{ height: nodes[nodes.length - 1].y + 92 }}>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 900 ${nodes[nodes.length - 1].y + 92}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d={safePathD}
              stroke="#6366F1"
              strokeWidth="3"
              strokeDasharray="5 9"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0.35 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </svg>

          {STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isRight = index % 2 === 1;
            const top = nodes[index].y - 64;
            const cardLeft = isRight ? 510 : 40;
            const connectorLeft = isRight ? nodeX : 360;

            return (
              <React.Fragment key={stage.title}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="absolute"
                  style={{ top, left: cardLeft, width: 300 }}
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-[24px] border border-white/60 bg-white/72 p-5 backdrop-blur-[14px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="inline-flex rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                          Step {stage.step}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold leading-6 text-slate-900">
                          {stage.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <div
                  className="pointer-events-none absolute border-t-2 border-dashed border-slate-300"
                  style={{
                    top: nodes[index].y,
                    left: connectorLeft,
                    width: 60,
                    transform: 'translateY(-50%)',
                  }}
                />

                <div
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-indigo-500 shadow-[0_0_0_6px_rgba(99,102,241,0.12)]"
                  style={{
                    left: nodeX,
                    top: nodes[index].y,
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
