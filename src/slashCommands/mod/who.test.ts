import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/user.service");

import * as userService from "../../shared/services/user.service";
import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import who from "./who";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/who", () => {
  const sampleUser = {
    name: "Diego",
    discordId: "111",
    birthdayDay: "17",
    birthdayMonth: "2",
  };

  it("looks up by user option when provided", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction();
    await who.run(createMockClient(), interaction, [arg("user", "111")]);

    expect(userService.getUserById).toHaveBeenCalledWith("111");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("looks up by name when only the name option is provided", async () => {
    vi.mocked(userService.getUserByName).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction();
    await who.run(createMockClient(), interaction, [arg("name", "Diego")]);

    expect(userService.getUserByName).toHaveBeenCalledWith("Diego");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("falls back to the caller's discordId when neither option is provided", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction({ user: { id: "caller-1" } });
    await who.run(createMockClient(), interaction, []);

    expect(userService.getUserById).toHaveBeenCalledWith("caller-1");
  });
});
