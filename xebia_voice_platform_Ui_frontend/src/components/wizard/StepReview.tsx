import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Plug, Languages, Volume2, User } from 'lucide-react';
import { WizardData } from '@/pages/CreateAgent';
import { AVATARS } from '@/components/AvatarSelector';

interface StepReviewProps {
  data: WizardData;
}

export function StepReview({ data }: StepReviewProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-5xl flex-shrink-0">
              {data.templateIcon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-foreground mb-1 truncate">{data.name}</h2>
              <p className="text-base text-muted-foreground">{data.template}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Ready to create</span>
          </div>
        </div>

        {data.description && (
          <p className="text-base text-muted-foreground leading-relaxed">{data.description}</p>
        )}
      </motion.div>

      {/* Configuration Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Summary */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Configuration</h3>
            </div>
            <div className="space-y-4 pl-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Personality</span>
                <span className="text-sm font-semibold text-foreground capitalize px-3 py-1 bg-muted rounded-md">
                  {data.personality}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Verbosity</span>
                <span className="text-sm font-semibold text-foreground px-3 py-1 bg-muted rounded-md">
                  {data.verbosity < 33 ? 'Concise' : data.verbosity > 66 ? 'Detailed' : 'Balanced'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Formality</span>
                <span className="text-sm font-semibold text-foreground px-3 py-1 bg-muted rounded-md">
                  {data.formality < 33 ? 'Casual' : data.formality > 66 ? 'Formal' : 'Balanced'}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Documents</h3>
            </div>
            <div className="pl-1">
              {data.documents.length > 0 ? (
                <ul className="space-y-2.5">
                  {data.documents.map((doc, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground py-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Languages className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Languages</h3>
            </div>
            <div className="pl-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                {data.languages.map(lang => (
                  <span key={lang} className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium capitalize">
                    {lang}
                  </span>
                ))}
              </div>
              {data.autoDetectLanguage && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Auto-detection enabled
                </p>
              )}
            </div>
          </div>

          {/* Voice */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Voice</h3>
            </div>
            <div className="pl-1">
              <span className="inline-flex items-center px-4 py-2 bg-muted rounded-lg text-sm font-medium capitalize">
                {data.voiceId}
              </span>
            </div>
          </div>

          {/* Avatar */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Avatar</h3>
            </div>
            <div className="pl-1">
              {data.avatarId ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 w-fit">
                  <img
                    src={AVATARS.find(a => a.id === data.avatarId)?.image}
                    alt="Selected avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/50"
                  />
                  <span className="text-sm font-semibold text-foreground pr-2">
                    {AVATARS.find(a => a.id === data.avatarId)?.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground py-2 block">Audio Only (No Avatar)</span>
              )}
            </div>
          </div>

          {/* Integrations */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
            </div>
            <div className="pl-1">
              {data.integrations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.integrations.map(int => (
                    <span key={int} className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium capitalize">
                      {int}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No integrations selected</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
