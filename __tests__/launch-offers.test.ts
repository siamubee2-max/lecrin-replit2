import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetLaunchOfferClaimsForTests,
  claimLaunchOfferForClient,
  getCurrentLaunchCampaign,
  getLaunchOfferCampaignCounts,
} from "../server/db";

describe("Launch offers sequencing 100/100/100/200", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
    __resetLaunchOfferClaimsForTests();
  });

  it("renvoie toujours la meme campagne pour un meme client", async () => {
    const first = await claimLaunchOfferForClient("client_same_001");
    const second = await claimLaunchOfferForClient("client_same_001");

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.campaignKey).toBe("yearly_50_first_100");
    expect(second?.campaignKey).toBe(first?.campaignKey);
  });

  it("respecte la sequence des paliers jusqu'a epuisement", async () => {
    for (let i = 0; i < 100; i += 1) {
      await claimLaunchOfferForClient(`client_a_${i}`);
    }
    expect(await getCurrentLaunchCampaign()).toBe("yearly_25_next_100");

    for (let i = 0; i < 100; i += 1) {
      await claimLaunchOfferForClient(`client_b_${i}`);
    }
    expect(await getCurrentLaunchCampaign()).toBe("yearly_10_next_100");

    for (let i = 0; i < 100; i += 1) {
      await claimLaunchOfferForClient(`client_c_${i}`);
    }
    expect(await getCurrentLaunchCampaign()).toBe("monthly_10_next_200");

    for (let i = 0; i < 200; i += 1) {
      await claimLaunchOfferForClient(`client_d_${i}`);
    }

    const counts = await getLaunchOfferCampaignCounts();
    expect(counts.yearly_50_first_100).toBe(100);
    expect(counts.yearly_25_next_100).toBe(100);
    expect(counts.yearly_10_next_100).toBe(100);
    expect(counts.monthly_10_next_200).toBe(200);
    expect(await getCurrentLaunchCampaign()).toBeNull();
  });
});
