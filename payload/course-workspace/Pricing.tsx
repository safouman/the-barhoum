import { Gutter } from "@payloadcms/ui";
import { notFound } from "next/navigation";
import type { DocumentViewServerProps } from "payload";
import { formatOfferPrice } from "../../components/commerce/checkout";
import { CommerceError } from "../../lib/commerce/course-payments/core";
import { courseStripe, readStripePrice } from "../../lib/commerce/course-payments/stripe";
import { courseCurriculumReferences, relationshipID } from "../curriculum";
import { OfferDrawer } from "./OfferDrawer";

export async function CoursePricing({ doc, initPageResult: { req } }: DocumentViewServerProps) {
    const id = relationshipID(doc);
    if (id == null || req.user?.collection !== "admins") notFound();

    const [course, { docs: offers }, { docs: modules }] = await Promise.all([
        req.payload.findByID({ collection: "courses", id, draft: false, depth: 0, disableErrors: true, overrideAccess: false, req }),
        req.payload.find({ collection: "course-offers", depth: 0, pagination: false, overrideAccess: false, req,
            where: { course: { equals: id } } }),
        req.payload.find({ collection: "modules", depth: 0, pagination: false, overrideAccess: false, req,
            where: { course: { equals: id }, classification: { equals: "premium" }, _status: { equals: "published" } },
            select: { title: true } }),
    ]);

    const published = course?._status === "published";
    const placedModules = new Set(published ? courseCurriculumReferences(course)?.modules : []);
    const eligibleModules = modules.filter(module => placedModules.has(String(module.id)));
    const offeredModules = new Set(offers.map(offer => Number(relationshipID(offer.module)) || null));
    const moduleTitles = new Map(modules.map(module => [module.id, module.title]));
    const priceByID = new Map(Array.from(new Set(offers.map(offer => offer.stripePriceId)), priceID => [
        priceID,
        (async () => {
            try {
                const provider = await courseStripe();
                return await readStripePrice(provider, priceID);
            } catch (error) {
                return error instanceof CommerceError && error.code === "OFFER_UNAVAILABLE"
                    ? "Price is missing, inactive, or unsupported in this Stripe environment."
                    : "Stripe could not validate the price. Try again later.";
            }
        })(),
    ]));

    return (
        <Gutter>
            <h2>Pricing</h2>
            <p>Use an existing Stripe Price ID. Saving content and enabling an offer are separate actions.</p>
            {!published && <p>Publish the course before it can be sold.</p>}
            {offers.length > 0 && <ul>
                {await Promise.all(offers.map(async offer => {
                    const moduleID = Number(relationshipID(offer.module)) || null;
                    const price = await priceByID.get(offer.stripePriceId);
                    const target = moduleID === null ? "Base course" : moduleTitles.get(moduleID) ?? `Module #${moduleID}`;
                    return <li key={offer.id}>
                        <strong>{target}</strong> · {offer.enabled ? "Enabled" : "Disabled"}
                        {moduleID !== null && !placedModules.has(String(moduleID)) && " · Module is outside the published curriculum"}
                        <p>{typeof price === "string" || !price ? price : formatOfferPrice({ ...price, id: offer.id, moduleId: moduleID })}</p>
                        <OfferDrawer courseID={id} moduleID={moduleID} offerID={offer.id} />
                    </li>;
                }))}
            </ul>}
            <h3>Add an offer</h3>
            {!offeredModules.has(null) && <div>Base course <OfferDrawer courseID={id} moduleID={null} /></div>}
            {eligibleModules.filter(module => !offeredModules.has(module.id)).map(module => (
                <div key={module.id}>{module.title} <OfferDrawer courseID={id} moduleID={module.id} /></div>
            ))}
            <p>Premium modules become available here after the module and its placement are published.</p>
        </Gutter>
    );
}
