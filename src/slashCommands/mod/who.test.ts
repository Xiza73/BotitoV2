import { Collection, MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/user.service");

import * as userService from "../../shared/services/user.service";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import who from "./who";

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleUser = {
  name: "Pineappletooth",
  discordId: "111",
  birthdayDay: "5",
  birthdayMonth: "5",
};

const stubFetchedUser = (client: any, overrides: Partial<any> = {}) => {
  vi.mocked(client.users.fetch).mockResolvedValue({
    id: "111",
    tag: "PaviCasado#0001",
    username: "PaviCasado",
    avatarURL: () => "https://example.com/avatar.png",
    createdTimestamp: new Date(2020, 0, 15).getTime(),
    ...overrides,
  } as any);
};

describe("/who", () => {
  it("looks up by user option when provided", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const interaction = createMockInteraction({ guild: null });
    await who.run(client, interaction, [arg("user", "111")]);

    expect(userService.getUserById).toHaveBeenCalledWith("111");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("looks up by name when only the name option is provided", async () => {
    vi.mocked(userService.getUserByName).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const interaction = createMockInteraction({ guild: null });
    await who.run(client, interaction, [arg("name", "Pineappletooth")]);

    expect(userService.getUserByName).toHaveBeenCalledWith("Pineappletooth");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("falls back to the caller's discordId when neither option is provided", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const interaction = createMockInteraction({
      user: { id: "caller-1" },
      guild: null,
    });
    await who.run(client, interaction, []);

    expect(userService.getUserById).toHaveBeenCalledWith("caller-1");
  });

  it("uses the real name as the embed title (not 'CUMpleaños')", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const interaction = createMockInteraction({ guild: null });
    await who.run(client, interaction, [arg("user", "111")]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("Pineappletooth");
    expect(embed.color).toBe(0xed4245);
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();
  });

  it("renders the canonical fields: Discord, birthday, next birthday, account created", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const interaction = createMockInteraction({ guild: null });
    await who.run(client, interaction, [arg("user", "111")]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    const names = embed.fields.map((f: any) => f.name);
    expect(names).toContain("👤 Discord");
    expect(names).toContain("🎂 Cumpleaños");
    expect(names).toContain("📅 Próximo cumple");
    expect(names).toContain("📆 Cuenta creada");

    const cumple = embed.fields.find((f: any) => f.name === "🎂 Cumpleaños");
    expect(cumple.value).toContain("5 de Mayo");

    // Discord relative time format used for next birthday
    const next = embed.fields.find((f: any) => f.name === "📅 Próximo cumple");
    expect(next.value).toMatch(/^<t:\d+:R>$/);
  });

  it("includes guild-specific fields (joined-at + top roles) when in a guild", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const fakeRoles = new Collection<string, any>([
      ["everyone", { id: "@e", name: "@everyone", position: 0 }],
      ["mod", { id: "modrole", name: "Mod", position: 5 }],
      ["fan", { id: "fanrole", name: "Fan", position: 2 }],
    ]);

    const guildMember = {
      joinedTimestamp: new Date(2022, 5, 1).getTime(),
      roles: { cache: fakeRoles },
    };

    const interaction = createMockInteraction({
      guild: {
        members: { fetch: vi.fn().mockResolvedValue(guildMember) },
      },
    });

    await who.run(client, interaction, [arg("user", "111")]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    const names = embed.fields.map((f: any) => f.name);
    expect(names).toContain("🎉 En el servidor desde");
    expect(names).toContain("✨ Roles principales");

    // @everyone filtered out, top role first
    const rolesField = embed.fields.find(
      (f: any) => f.name === "✨ Roles principales"
    );
    expect(rolesField.value).toContain("<@&modrole>");
    expect(rolesField.value).toContain("<@&fanrole>");
    expect(rolesField.value).not.toContain("@everyone");
  });

  it("public by default, ephemeral when private:true", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);
    const client = createMockClient();
    stubFetchedUser(client);

    const i1 = createMockInteraction({ guild: null });
    await who.run(client, i1, [arg("user", "111")]);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction({ guild: null });
    await who.run(client, i2, [arg("user", "111"), arg("private", true)]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });
});
