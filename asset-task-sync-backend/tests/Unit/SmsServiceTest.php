<?php

namespace Tests\Unit;

use App\Services\SmsService;
use PHPUnit\Framework\TestCase;

class SmsServiceTest extends TestCase
{
    private function service(): SmsService
    {
        return new SmsService;
    }

    public function test_normalizes_local_ethio_telecom_number(): void
    {
        $this->assertSame('251912345678', $this->service()->normalizePhone('0912345678'));
    }

    public function test_normalizes_local_number_without_leading_zero(): void
    {
        $this->assertSame('251912345678', $this->service()->normalizePhone('912345678'));
    }

    public function test_normalizes_international_formats(): void
    {
        $this->assertSame('251912345678', $this->service()->normalizePhone('+251912345678'));
        $this->assertSame('251912345678', $this->service()->normalizePhone('251912345678'));
    }

    public function test_normalizes_safaricom_07_network(): void
    {
        $this->assertSame('251712345678', $this->service()->normalizePhone('0712345678'));
    }

    public function test_strips_formatting_characters(): void
    {
        $this->assertSame('251912345678', $this->service()->normalizePhone('0912 345 678'));
        $this->assertSame('251912345678', $this->service()->normalizePhone('+251 (912) 345-678'));
    }

    public function test_rejects_invalid_numbers(): void
    {
        $this->assertNull($this->service()->normalizePhone(null));
        $this->assertNull($this->service()->normalizePhone(''));
        $this->assertNull($this->service()->normalizePhone('12345'));        // too short
        $this->assertNull($this->service()->normalizePhone('09123456'));     // too short
        $this->assertNull($this->service()->normalizePhone('0512345678'));   // not a mobile network
        $this->assertNull($this->service()->normalizePhone('not-a-number'));
    }
}
