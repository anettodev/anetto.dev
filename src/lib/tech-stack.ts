import type { BrandId } from "../components/Icon.astro";

/**
 * The Tech Stack section (Home and About; components/TechStack.astro), in
 * display order. Names are proper nouns, shown as written in every locale.
 * `icon` is a mark in Icon.astro (Simple Icons); without one the pill shows
 * just the name. `color` (`#rrggbb`) fills the pill, e.g. the brand's
 * colour, with dark or light text picked for contrast; without it the pill
 * takes the theme's own colours (surface and text, dark or light).
 *
 * Empty until Antonio supplies the list: the section shows a [PLACEHOLDER]
 * instead (spec rule: no invented claims).
 */
/**
 * What a technology is, for its pill's colour when it has no brand colour
 * (TechStack.astro): a language, an Apple framework, a library, a build or
 * distribution tool, or an architecture pattern.
 */
export type TechGroup = "language" | "apple" | "library" | "tool" | "pattern";

export interface TechItem {
  name: string;
  icon?: BrandId;
  color?: `#${string}`;
  /** Colours the pill by kind when it has no `color` (Antonio's request). */
  group?: TechGroup;
}

/*
 * SAMPLE to try (requested by Antonio): the tools his resume names, with
 * brand colours where the tool has one. On 2026-10-07 Antonio added 16 more,
 * each named in the resume, About, the projects or the site's data (Xcode on
 * Antonio's word), architecture patterns included. Edit, reorder or empty
 * before shipping; it's his list to confirm.
 */
export const TECH_STACK: readonly TechItem[] = [
  { name: "Swift", icon: "swift", color: "#F05138" },
  { name: "Objective-C", group: "language" },
  { name: "Python", icon: "python", color: "#3776AB" },
  { name: "SwiftUI", group: "apple" },
  { name: "UIKit", group: "apple" },
  { name: "SwiftData", group: "apple" },
  { name: "Core Data", group: "apple" },
  { name: "CloudKit", group: "apple" },
  { name: "HealthKit", group: "apple" },
  { name: "XCTest", group: "apple" },
  { name: "Xcode", icon: "xcode", color: "#147EFB" },
  { name: "RxSwift", icon: "reactivex", color: "#B7178C" },
  { name: "Swinject", group: "library" },
  { name: "Kingfisher", group: "library" },
  { name: "Charts", group: "library" },
  { name: "Lottie", icon: "lottiefiles", color: "#00DDB3" },
  { name: "Fastlane", icon: "fastlane", color: "#00F200" },
  { name: "Bitrise", icon: "bitrise", color: "#683D87" },
  { name: "TestFlight", group: "tool" },
  { name: "CocoaPods", color: "#EE3322" },
  { name: "Carthage", group: "tool" },
  { name: "Swift Package Manager", group: "tool" },
  { name: "Tuist", group: "tool" },
  { name: "Git", icon: "git", color: "#F03C2E" },
  { name: "SVN", icon: "subversion", color: "#809CC9" },
  { name: "Cloudflare", icon: "cloudflare", color: "#F38020" },
  { name: "MVVM-C", group: "pattern" },
  { name: "MVVM", group: "pattern" },
  { name: "VIPER", group: "pattern" },
  { name: "MVC", group: "pattern" },
  { name: "DDD", group: "pattern" },
  { name: "ViewCode", group: "pattern" },
];
