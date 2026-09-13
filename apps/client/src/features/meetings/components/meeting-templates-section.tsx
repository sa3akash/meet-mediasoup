import { CreateTemplateModal } from "../../../features/meetings/create-template-modal";
import { MeetingTemplateCard } from "../../../features/meetings/meeting-template-card";

interface MeetingTemplatesSectionProps {
  templates: any[];
}

export function MeetingTemplatesSection({ templates }: MeetingTemplatesSectionProps) {
  return (
    <section aria-labelledby="templates-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="templates-heading" className="text-base font-semibold text-white">
            Quick Start from Template
          </h2>
          <span className="text-neutral-500 text-xs">{templates.length} templates available</span>
        </div>
        <CreateTemplateModal />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((tpl: any) => (
          <MeetingTemplateCard key={tpl.id} template={tpl} />
        ))}
      </div>
    </section>
  );
}
