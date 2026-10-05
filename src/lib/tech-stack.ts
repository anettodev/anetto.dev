import type { BrandId } from "../components/Icon.astro";

/**
 * The Tech Stack section (Home and About; components/TechStack.astro), in
 * display order. Names are proper nouns, shown as written in every locale.
 * `icon` is a mark in Icon.astro (Simple Icons); without one the pill shows
 * the name's initial. `color` (`#rrggbb`) fills the pill, e.g. the brand's
 * colour, with dark or light text picked for contrast; without it the pill
 * takes the theme's own colours (surface and text, dark or light).
 *
 * Empty until Antonio supplies the list: the section shows a [PLACEHOLDER]
 * instead (spec rule: no invented claims).
 */
export interface TechItem {
  name: string;
  icon?: BrandId;
  color?: `#${string}`;
}

/*
 * SAMPLE to try (requested by Antonio): the tools his resume names, with
 * brand colours where the tool has one. Edit, reorder or empty before
 * shipping; it's his list to confirm.
 */
export const TECH_STACK: readonly TechItem[] = [
  { name: "Swift", icon: "swift", color: "#F05138" },
  { name: "Objective-C" },
  { name: "SwiftUI" },
  { name: "UIKit" },
  { name: "XCTest" },
  { name: "RxSwift", icon: "reactivex", color: "#B7178C" },
  { name: "Lottie", icon: "lottiefiles", color: "#00DDB3" },
  { name: "Fastlane", icon: "fastlane", color: "#00F200" },
  { name: "Bitrise", icon: "bitrise", color: "#683D87" },
  { name: "TestFlight" },
  { name: "CocoaPods", color: "#EE3322" },
  { name: "Carthage" },
  { name: "Swift Package Manager" },
  { name: "Tuist" },
  { name: "Git", color: "#F03C2E" },
  { name: "SVN", icon: "subversion", color: "#809CC9" },
];
