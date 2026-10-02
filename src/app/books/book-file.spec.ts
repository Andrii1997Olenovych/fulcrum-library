import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadLibraryFile, readLibraryFile } from './book-file';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('library files', () => {
  it('reads UTF-8 bytes and rejects malformed UTF-8', async () => {
    const xml =
      '<library><book><title>River 📘</title><author>A</author><pages>2</pages></book></library>';
    const valid = new File([new TextEncoder().encode(xml)], 'library.xml');
    const invalid = new File([Uint8Array.of(0xc3, 0x28)], 'broken.xml');

    await expect(readLibraryFile(valid)).resolves.toEqual([
      { title: 'River 📘', author: 'A', pages: 2 },
    ]);
    await expect(readLibraryFile(invalid)).rejects.toThrow(/not valid UTF-8/);
  });

  it('downloads XML as library.xml and revokes its URL after the browser can start', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob).toBeInstanceOf(Blob);
      return 'blob:library';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    let clickedLink: { href: string; download: string; connected: boolean } | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clickedLink = { href: this.href, download: this.download, connected: this.isConnected };
    });

    downloadLibraryFile([{ title: 'A & B', author: 'Writer', pages: 3 }]);

    expect(clickedLink?.download).toBe('library.xml');
    expect(clickedLink?.href).toBe('blob:library');
    expect(clickedLink?.connected).toBe(true);
    expect(document.querySelector('a[download="library.xml"]')).toBeNull();
    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls.at(0)?.[0];
    expect(blob?.type).toBe('application/xml;charset=utf-8');
    expect(await blob?.text()).toContain('<title>A &amp; B</title>');

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:library');
  });
});
