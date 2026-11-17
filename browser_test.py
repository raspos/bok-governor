from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    for width in (320, 390, 768, 1440):
        context = browser.new_context(viewport={"width": width, "height": 900},
                                      is_mobile=width <= 390, has_touch=width <= 390)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        def check_layout():
            assert page.locator("main h1").count() == 1
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width

        assert page.goto("http://127.0.0.1:4173").ok
        check_layout()
        page.locator('[data-metric="rate"]').click()
        assert page.locator("dialog").is_visible()
        page.get_by_role("button", name="닫기").click()
        for turn in range(1, 9):
            page.locator('[data-action="meeting"]').click()
            check_layout()
            page.get_by_text("내수와 고용의 하방 위험", exact=True).first.click()
            page.locator('input[name="proposal"][value="0.25"]').check()
            page.locator('button[type="submit"]').click()
            if turn in (2, 4, 6, 8):
                assert page.get_by_role("heading", name="총재의 점도표").is_visible()
                page.reload()
                page.locator("#dot-form button").click()
                check_layout()
                chart = page.locator(".dot-charts section").first
                assert chart.locator(".dot-track i").count() == 21
                assert chart.locator(".dot-row").evaluate_all("""rows => rows.every(row => {
                    const dots = [...row.querySelectorAll('i')].map(dot => dot.getBoundingClientRect());
                    return dots.every((dot, i) => dot.width >= 4 && (!i || dots[i-1].right <= dot.left));
                })""")
                if turn == 8:
                    assert chart.get_by_text("2028-05 기준금리 수준").is_visible()
            assert page.get_by_role("heading", name="기자회견", exact=True).is_visible()
            page.locator("#press-form button").click()
            check_layout()
            assert page.locator("tbody").first.locator("tr").count() == 7
            page.locator("#metric-select").select_option("fx")
            assert page.locator('#comparison svg').get_attribute('aria-label') == "원/달러 환율 추세"
            page.reload()
            assert page.locator("main h1").inner_text().startswith("기준금리")
            page.locator('[data-action="next"]').click()
            check_layout()
        assert page.locator("main h1").inner_text() == "어떤 총재로 남을 것인가."
        assert page.get_by_role("heading", name="2029년 역사적 재평가").is_visible()
        page.locator('[data-action="reset"]').click()
        page.evaluate("localStorage.setItem('bok-governor-v2', '{broken')")
        page.reload()
        assert page.locator('[data-action="meeting"]').is_visible()
        assert not errors, errors
        print(f"{width}px: eight meetings, comparison, reassessment, reload, recovery, layout OK")
        context.close()

