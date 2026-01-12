import { motion } from "framer-motion";
import { LayoutGrid, Upload, Rocket } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: LayoutGrid,
    title: "Choose Template",
    description:
      "Select from pre-built templates for onboarding, HR, tech support, or create custom agents",
  },
  {
    step: "02",
    icon: Upload,
    title: "Upload Knowledge",
    description:
      "Drag and drop PDFs, Word docs, or wiki pages. We handle the rest.",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Deploy & Share",
    description:
      "Instant deployment. Employees start asking questions immediately via voice or text.",
  },
];

const SolutionSection = () => {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Create Voice Agents in{" "}
            <span className="text-gradient">Minutes, Not Months</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our intuitive platform makes it incredibly simple to build powerful AI agents.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-hero -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  {/* Step Number */}
                  <div className="relative z-10 w-20 h-20 mx-auto rounded-3xl bg-gradient-hero flex items-center justify-center mb-6 shadow-glow">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>

                  {/* Step Badge */}
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    Step {step.step}
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
