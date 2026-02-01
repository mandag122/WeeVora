import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1" data-testid="page-terms">
        <section className="bg-gradient-to-br from-eggplant/5 via-white to-gold/5 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="font-bold text-3xl md:text-4xl text-eggplant mb-2" data-testid="text-terms-title">
                WeeVora Terms of Service
              </h1>
              <p className="text-muted-foreground">
                Effective Date: February 1, 2026
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Owner: Amanda, WeeVora · Mundelein, Lake County, Illinois
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg max-w-none prose-headings:text-eggplant">
              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">1. Agreement to Terms</h2>
              <p className="text-foreground/80 leading-relaxed">
                By accessing or using WeeVora (the &quot;Site&quot;), you agree to these Terms of Service (&quot;Terms&quot;). If you do not agree, please do not use the Site. These Terms apply to all visitors and users of the Site.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">2. What WeeVora Is (and Isn&apos;t)</h2>
              <p className="text-foreground/80 leading-relaxed">
                WeeVora is a free, informational planning tool designed to help Lake County, Illinois families discover local summer camps, activities, crafts, and recipes, and organize them visually on a calendar.
              </p>
              <p className="text-foreground/80 leading-relaxed font-medium mt-4">WeeVora is not:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li><strong>A registration or booking platform.</strong> You cannot enroll in or pay for any camp or activity through this Site.</li>
                <li><strong>An endorsement of any camp or activity listed.</strong> Inclusion on WeeVora does not guarantee quality, safety, or availability.</li>
                <li><strong>A replacement for contacting camps or activity providers directly.</strong> All registration, pricing, and availability must be confirmed with the provider.</li>
              </ul>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">3. Use of the Site</h2>
              <p className="text-foreground/80 leading-relaxed font-medium">Permitted Use</p>
              <p className="text-foreground/80 leading-relaxed">You may use WeeVora to:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Browse and discover camps and activities in the Lake County area</li>
                <li>Build and save a personal activity plan using the calendar planning tool</li>
                <li>Print your plan for personal use</li>
                <li>Submit feedback or suggestions via the Contact form</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed font-medium mt-6">Prohibited Use</p>
              <p className="text-foreground/80 leading-relaxed">You may not:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Use the Site for any unlawful purpose</li>
                <li>Attempt to scrape, crawl, or extract data from the Site in bulk without written permission</li>
                <li>Misrepresent yourself or your affiliation with any organization</li>
                <li>Submit false or misleading information through any form on the Site</li>
                <li>Interfere with the operation of the Site in any way</li>
              </ul>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">4. Accuracy of Information</h2>
              <p className="text-foreground/80 leading-relaxed">
                WeeVora makes a best effort to provide accurate camp and activity information. However, all data is sourced from third-party providers and may be incomplete, outdated, or inaccurate. Prices, dates, availability, and registration details are subject to change without notice. Always contact the camp or activity provider directly to confirm current information before making decisions.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">5. No Warranties</h2>
              <p className="text-foreground/80 leading-relaxed uppercase font-semibold">
                The Site is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, express or implied. This includes but is not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p className="text-foreground/80 leading-relaxed mt-4">
                WeeVora does not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">6. Limitation of Liability</h2>
              <p className="text-foreground/80 leading-relaxed">
                To the fullest extent permitted by law, WeeVora shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Site, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Decisions made based on information found on the Site</li>
                <li>Interactions with third-party camps or activity providers</li>
                <li>Loss of data or inability to access saved plans</li>
                <li>Any inaccuracy in camp or activity listings</li>
              </ul>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">7. Third-Party Links</h2>
              <p className="text-foreground/80 leading-relaxed">
                The Site may contain links to third-party websites (e.g., camp websites, park district pages). WeeVora has no control over and assumes no responsibility for the content or practices of any third-party sites. You access third-party sites at your own risk.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">8. User Submissions</h2>
              <p className="text-foreground/80 leading-relaxed">
                When you submit feedback, camp suggestions, or corrections through the Contact form, you grant WeeVora a non-exclusive, royalty-free license to use that information to improve the Site. You represent that any information you submit is accurate and does not violate any third-party rights.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">9. Intellectual Property</h2>
              <p className="text-foreground/80 leading-relaxed">
                All content on WeeVora — including text, images, illustrations, logos, and design — is the property of WeeVora or its licensors. You may not reproduce, distribute, or create derivative works without written permission, except for personal, non-commercial use (e.g., printing your own plan).
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">10. Changes to Terms</h2>
              <p className="text-foreground/80 leading-relaxed">
                WeeVora reserves the right to update these Terms at any time. Changes will be posted on this page with an updated effective date. Your continued use of the Site after any changes constitutes acceptance of the new Terms.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">11. Governing Law</h2>
              <p className="text-foreground/80 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Illinois, without regard to conflict of law principles.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">12. Contact</h2>
              <p className="text-foreground/80 leading-relaxed">
                If you have questions about these Terms, please contact:
              </p>
              <p className="text-foreground/80 leading-relaxed mt-2">
                Amanda<br />
                WeeVora<br />
                Mundelein, Illinois<br />
                <a href="mailto:support@weevora.com" className="text-eggplant hover:text-eggplant-light underline">
                  support@weevora.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
