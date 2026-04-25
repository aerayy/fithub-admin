import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:5173
        await page.goto("http://localhost:5173")
        
        # -> Fill the coach credentials (elif.demir@fithub.demo / FitHub2026Demo!) into the email and password fields and submit the login form.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div/div/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('elif.demir@fithub.demo')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div/div/form/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('FitHub2026Demo!')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the 'Öğrenciler' (Students) navigation link to open the students list.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/aside/nav/a[2]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the first student in the students list to load the student detail page, then extract the tab bar labels to verify they exactly match ['Genel Bakış','Programlar','Öğün Fotoğrafları','Form Analizi'] and that there is no 'Mesajlar' tab.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div[2]/table/tbody/tr/td/div/div').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        assert (await frame.locator("xpath=//*[contains(., 'Genel Bakış')]").nth(0).is_visible() and await frame.locator("xpath=//*[contains(., 'Programlar')]").nth(0).is_visible() and await frame.locator("xpath=//*[contains(., 'Öğün Fotoğrafları')]").nth(0).is_visible() and await frame.locator("xpath=//*[contains(., 'Form Analizi')]").nth(0).is_visible() and not (await frame.locator("xpath=//*[contains(., 'Mesajlar')]").nth(0).is_visible())), "The student detail tab bar should show Genel Bakış, Programlar, Öğün Fotoğrafları, and Form Analizi and should not include a Mesajlar tab."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    