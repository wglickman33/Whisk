import { Link } from "react-router-dom";
import { CapabilitySection } from "../../components/capabilities/CapabilitySection";
import { FormatChipList } from "../../components/capabilities/FormatChipList";
import "../../components/capabilities/CapabilitySection.scss";
import {
  APP_CAPABILITIES,
  CAPABILITIES_COPY,
  IMPOSSIBLE_EXAMPLES,
  TOOL_CAPABILITIES,
  UNSUPPORTED_ITEMS,
  getSupportedFormatGroups,
} from "../../constants/capabilities";
import "./CapabilitiesPage.scss";

export function CapabilitiesPage() {
  const formatGroups = getSupportedFormatGroups();

  return (
    <article className="capabilities-page">
      <header className="capabilities-page__header">
        <h1>{CAPABILITIES_COPY.pageTitle}</h1>
        <p>{CAPABILITIES_COPY.pageSubtitle}</p>
        <p className="capabilities-page__tagline">{CAPABILITIES_COPY.freeTagline}</p>
      </header>

      <section className="capabilities-page__local" aria-label="Privacy note">
        <span className="capabilities-page__badge">Processed on your device</span>
        <p>{CAPABILITIES_COPY.supportedNote}</p>
      </section>

      <section
        className="capability-section capabilities-page__supported"
        id="supported"
        aria-labelledby="supported-title"
      >
        <h2 className="capability-section__title" id="supported-title">
          {CAPABILITIES_COPY.supportedTitle}
        </h2>
        <p className="capability-section__note">File formats you can convert in the browser.</p>
        <div className="capabilities-page__groups" aria-label="Supported file formats by category">
          {formatGroups.map((group) => (
            <div key={group.id} className="capabilities-page__group">
              <h3 className="capabilities-page__group-title">{group.label}</h3>
              <FormatChipList items={group.items} variant="supported" />
            </div>
          ))}
        </div>
      </section>

      <CapabilitySection
        title={CAPABILITIES_COPY.toolsTitle}
        items={TOOL_CAPABILITIES}
        variant="neutral"
      />

      <CapabilitySection
        title={CAPABILITIES_COPY.appTitle}
        items={APP_CAPABILITIES}
        variant="neutral"
      />

      <CapabilitySection
        id="unsupported"
        title={CAPABILITIES_COPY.unsupportedTitle}
        note={CAPABILITIES_COPY.unsupportedNote}
        items={UNSUPPORTED_ITEMS}
        variant="unsupported"
      />

      <CapabilitySection
        title={CAPABILITIES_COPY.impossibleTitle}
        note={CAPABILITIES_COPY.impossibleNote}
        items={IMPOSSIBLE_EXAMPLES}
        variant="unsupported"
      />

      <footer className="capabilities-page__footer">
        <Link to="/converter/file">Open file converter</Link>
        <Link to="/how-it-works">How it works</Link>
        <Link to="/privacy">Privacy</Link>
      </footer>
    </article>
  );
}
