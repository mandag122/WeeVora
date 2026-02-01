import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1" data-testid="page-privacy">
        <section className="bg-gradient-to-br from-eggplant/5 via-white to-gold/5 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="font-bold text-3xl md:text-4xl text-eggplant mb-2" data-testid="text-privacy-title">
                WeeVora Privacy Policy
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
              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">1. What This Policy Covers</h2>
              <p className="text-foreground/80 leading-relaxed">
                This Privacy Policy explains how WeeVora collects, uses, and handles your personal information when you visit our website. We take your privacy seriously — especially since our users are parents planning for their children.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">2. Information We Collect</h2>
              <p className="text-foreground/80 leading-relaxed font-medium">Information You Provide Directly</p>
              <p className="text-foreground/80 leading-relaxed">When you use the Contact form, we may collect:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your message or feedback</li>
                <li>The category of your submission (e.g., feedback, camp suggestion, bug report)</li>
              </ul>

              <p className="text-foreground/80 leading-relaxed font-medium mt-6">Information Collected Automatically</p>
              <p className="text-foreground/80 leading-relaxed">When you visit the Site, we may automatically collect:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li><strong>Browser and device information</strong> — e.g., browser type, operating system, screen size</li>
                <li><strong>Usage data</strong> — e.g., pages visited, time spent on pages, links clicked</li>
                <li><strong>General location data</strong> — e.g., country or region (not precise geolocation)</li>
                <li><strong>Referral source</strong> — how you found the Site (e.g., Google search, Facebook link)</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                This data is collected through standard web analytics tools (e.g., Google Analytics) and is aggregated and anonymized. We do not collect or store individually identifiable usage data ourselves.
              </p>

              <p className="text-foreground/80 leading-relaxed font-medium mt-6">Information Stored Locally on Your Device</p>
              <p className="text-foreground/80 leading-relaxed">
                When you use the &quot;Save Plan&quot; feature, your activity plan data is stored locally on your device using browser storage. This data:
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Never leaves your device</li>
                <li>Is not transmitted to or stored on WeeVora&apos;s servers</li>
                <li>Is only accessible by you on the device and browser where it was saved</li>
                <li>Will be erased if you clear your browser data or use a different device/browser</li>
              </ul>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">3. How We Use Your Information</h2>
              <div className="overflow-x-auto my-6">
                <table className="w-full border border-border rounded-lg text-left text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border-b border-border px-4 py-3 font-semibold text-eggplant">Data Type</th>
                      <th className="border-b border-border px-4 py-3 font-semibold text-eggplant">How It&apos;s Used</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    <tr className="border-b border-border">
                      <td className="px-4 py-3">Contact form submissions</td>
                      <td className="px-4 py-3">To respond to your feedback, questions, or camp suggestions</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3">Analytics data</td>
                      <td className="px-4 py-3">To understand how people use the Site and improve the experience</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Locally stored plan data</td>
                      <td className="px-4 py-3">To allow you to save and reload your activity plan across sessions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-foreground/80 leading-relaxed font-medium">We do not use your information for:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Selling or sharing with advertisers</li>
                <li>Building marketing profiles</li>
                <li>Any purpose other than improving WeeVora</li>
              </ul>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">4. Information About Children</h2>
              <p className="text-foreground/80 leading-relaxed">
                WeeVora is a tool used by parents, not by children directly. We do not knowingly collect personal information from or about children under 13. If you believe we have inadvertently collected information about a child, please contact us immediately and we will delete it.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">5. Cookies and Tracking</h2>
              <p className="text-foreground/80 leading-relaxed">WeeVora may use:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li><strong>Essential cookies</strong> — required for the Site to function (e.g., browser storage for saved plans)</li>
                <li><strong>Analytics cookies</strong> — used by Google Analytics to help us understand Site usage (anonymized and aggregated)</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed font-medium">We do not use cookies for:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Advertising or retargeting</li>
                <li>Tracking you across other websites</li>
                <li>Building individual user profiles</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                You can control cookie settings through your browser preferences at any time.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">6. Data Sharing</h2>
              <p className="text-foreground/80 leading-relaxed">
                We do not sell, trade, or share your personal information with third parties, except:
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li><strong>Service providers</strong> — e.g., Google Analytics (for anonymized usage data only)</li>
                <li><strong>Legal requirement</strong> — if required by law or to protect the safety of users</li>
                <li><strong>Site operation</strong> — e.g., hosting providers needed to run the website</li>
              </ul>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">7. Data Retention</h2>
              <div className="overflow-x-auto my-6">
                <table className="w-full border border-border rounded-lg text-left text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border-b border-border px-4 py-3 font-semibold text-eggplant">Data Type</th>
                      <th className="border-b border-border px-4 py-3 font-semibold text-eggplant">How Long We Keep It</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    <tr className="border-b border-border">
                      <td className="px-4 py-3">Contact form submissions</td>
                      <td className="px-4 py-3">Until your inquiry is resolved, then deleted within 30 days</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3">Analytics data</td>
                      <td className="px-4 py-3">Aggregated and anonymized; retained per Google Analytics default settings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Locally stored plan data</td>
                      <td className="px-4 py-3">Stored on your device indefinitely until you clear it or it is automatically cleared by your browser</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">8. Your Rights</h2>
              <p className="text-foreground/80 leading-relaxed">You have the right to:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li><strong>Access</strong> — Request to see any personal information we hold about you</li>
                <li><strong>Delete</strong> — Request that we delete any personal information we hold</li>
                <li><strong>Opt out</strong> — Opt out of analytics tracking by adjusting your browser cookie settings or using Google&apos;s opt-out tool</li>
                <li><strong>Clear local data</strong> — Delete your saved plan at any time by clearing your browser storage</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                To exercise these rights, contact us via the Contact form on the Site.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">9. Security</h2>
              <p className="text-foreground/80 leading-relaxed">
                We take reasonable steps to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2 my-4">
                <li>Using HTTPS (encrypted connections) across the entire Site</li>
                <li>Minimizing the amount of personal data we collect</li>
                <li>Not storing sensitive personal data on our servers</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security, and we encourage you to take reasonable precautions with your own information.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">10. Third-Party Links and Services</h2>
              <p className="text-foreground/80 leading-relaxed">
                When you click a link to a third-party site (e.g., a camp&apos;s website), you leave WeeVora. We are not responsible for the privacy practices of third-party sites. We encourage you to review their privacy policies before sharing any personal information.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">11. Changes to This Policy</h2>
              <p className="text-foreground/80 leading-relaxed">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of the Site after changes constitutes acceptance of the updated policy.
              </p>

              <h2 className="text-xl font-semibold text-eggplant mt-8 mb-3">12. Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed">
                If you have questions or concerns about your privacy, or want to request access to or deletion of your data:
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
