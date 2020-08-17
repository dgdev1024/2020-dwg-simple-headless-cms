const copyText = async (key) => {
  const { permissions, clipboard } = navigator;
  const { state } = await permissions.query({ name: "clipboard-write" });
  if (state == "granted" || state == "prompt") {
    await clipboard.writeText(key);
  }
};
