package com.petcare.global.demo;

import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Random;
import javax.imageio.ImageIO;

/**
 * 데모 병원 커버 일러스트(800x450 PNG)를 코드로 그림 — 외부 이미지·저작권 걱정 없이 병원마다 다른 그림.
 * 컨테이너(JRE)에 한글 폰트가 없어서 글자는 넣지 않고 도형만 씀(병원 이름은 화면이 따로 보여줌).
 */
final class DemoImageGenerator {

	private static final int WIDTH = 800;
	private static final int HEIGHT = 450;

	// 배경 그라데이션(위, 아래) — 브랜드 청록과 어울리는 부드러운 색들
	private static final Color[][] PALETTES = {
			{new Color(0xCCFBF1), new Color(0x5EEAD4)},
			{new Color(0xFEF3C7), new Color(0xFCD34D)},
			{new Color(0xE0F2FE), new Color(0x7DD3FC)},
			{new Color(0xFCE7F3), new Color(0xF9A8D4)},
			{new Color(0xEDE9FE), new Color(0xC4B5FD)},
			{new Color(0xDCFCE7), new Color(0x86EFAC)},
	};

	static byte[] render(int index) {
		Random random = new Random(index * 7919L);
		Color[] palette = PALETTES[index % PALETTES.length];
		BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = image.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

		g.setPaint(new GradientPaint(0, 0, palette[0], 0, HEIGHT, palette[1]));
		g.fillRect(0, 0, WIDTH, HEIGHT);

		// 흩어진 발자국 — 위치·크기·기울기를 병원마다 다르게
		g.setColor(new Color(255, 255, 255, 110));
		for (int i = 0; i < 9; i++) {
			paw(g, random.nextInt(WIDTH), random.nextInt(HEIGHT), 18 + random.nextInt(22), random.nextDouble() * Math.PI);
		}

		// 바닥
		g.setColor(new Color(255, 255, 255, 90));
		g.fillRect(0, HEIGHT - 40, WIDTH, 40);

		// 가운데 병원 건물: 벽 → 지붕 → 창문 → 문 → 간판(십자). 폭·지붕 높이를 병원마다 조금씩 다르게
		Color accent = palette[1].darker();
		int bw = 280 + random.nextInt(80);
		int bh = 170;
		int bx = (WIDTH - bw) / 2;
		int by = HEIGHT - 40 - bh;
		int roof = 50 + random.nextInt(40);
		g.setColor(Color.WHITE);
		g.fill(new RoundRectangle2D.Double(bx, by, bw, bh + 12, 18, 18));
		g.setColor(accent);
		g.fillPolygon(new int[] {bx - 24, WIDTH / 2, bx + bw + 24}, new int[] {by + 8, by - roof, by + 8}, 3);

		g.setColor(palette[0]);
		int win = 46;
		for (int side = -1; side <= 1; side += 2) {
			int wx = WIDTH / 2 + side * (bw / 4) - win / 2;
			g.fill(new RoundRectangle2D.Double(wx, by + 70, win, win, 10, 10));
		}
		g.setColor(accent);
		g.fill(new RoundRectangle2D.Double(WIDTH / 2.0 - 30, by + bh - 78, 60, 90, 14, 14));

		int cx = WIDTH / 2;
		int cy = by + 34;
		g.setColor(new Color(0x0F766E));
		g.fill(new Ellipse2D.Double(cx - 30, cy - 30, 60, 60));
		g.setColor(Color.WHITE);
		g.fill(new RoundRectangle2D.Double(cx - 7, cy - 20, 14, 40, 6, 6));
		g.fill(new RoundRectangle2D.Double(cx - 20, cy - 7, 40, 14, 6, 6));
		g.dispose();

		try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			ImageIO.write(image, "png", out);
			return out.toByteArray();
		} catch (IOException e) {
			throw new UncheckedIOException("데모 이미지 생성 실패", e);
		}
	}

	private static void paw(Graphics2D g, int x, int y, int size, double angle) {
		Graphics2D p = (Graphics2D) g.create();
		p.translate(x, y);
		p.rotate(angle);
		p.fill(new Ellipse2D.Double(-size * 0.6, -size * 0.2, size * 1.2, size));
		double toe = size * 0.42;
		for (int i = 0; i < 4; i++) {
			double tx = (i - 1.5) * size * 0.45;
			double ty = -size * 0.75 + (i == 0 || i == 3 ? size * 0.25 : 0);
			p.fill(new Ellipse2D.Double(tx - toe / 2, ty - toe / 2, toe, toe * 1.2));
		}
		p.dispose();
	}

	private DemoImageGenerator() {
	}
}
