#include "offline_transaction_queue.h"

#include <Preferences.h>
#include <string.h>

static Preferences prefs;

static const char* NVS_NAMESPACE = "cw_queue";
static const uint16_t MAX_QUEUE = 30;
static const uint32_t MAGIC = 0x43575131; // "CWQ1"

static uint16_t queueCount = 0;
static uint32_t nextLocalId = 1;

static String keyFor(uint16_t index, const char* field)
{
    return String(field) + String(index);
}

static void saveMeta()
{
    prefs.putUShort("count", queueCount);
    prefs.putUInt("nextId", nextLocalId);
}

static void copyString(char* dst, size_t dstSize, const char* src)
{
    if(dstSize == 0) return;

    if(src == nullptr)
        src = "";

    strncpy(dst, src, dstSize - 1);
    dst[dstSize - 1] = '\0';
}

void offlineQueueInit()
{
    prefs.begin(NVS_NAMESPACE, false);

    uint32_t magic = prefs.getUInt("magic", 0);

    if(magic != MAGIC)
    {
        prefs.clear();
        prefs.putUInt("magic", MAGIC);
        queueCount = 0;
        nextLocalId = 1;
        saveMeta();
        return;
    }

    queueCount = prefs.getUShort("count", 0);
    nextLocalId = prefs.getUInt("nextId", 1);

    if(queueCount > MAX_QUEUE)
        queueCount = MAX_QUEUE;

    if(nextLocalId == 0)
        nextLocalId = 1;
}

bool offlineQueueAdd(
    const char* customerName,
    const char* service,
    float payment,
    uint16_t durationMinutes,
    const char* status,
    const char* paymentMethod,
    const char* createdAt
)
{
    if(queueCount >= MAX_QUEUE)
        return false;

    const uint16_t i = queueCount;

    prefs.putUInt(
        keyFor(i, "id").c_str(),
        nextLocalId
    );

    prefs.putString(
        keyFor(i, "customer").c_str(),
        customerName ? customerName : "Customer"
    );

    prefs.putString(
        keyFor(i, "service").c_str(),
        service ? service : "Carwash"
    );

    prefs.putFloat(
        keyFor(i, "payment").c_str(),
        payment
    );

    prefs.putUShort(
        keyFor(i, "duration").c_str(),
        durationMinutes
    );

    prefs.putString(
        keyFor(i, "status").c_str(),
        status ? status : "COMPLETED"
    );

    prefs.putString(
        keyFor(i, "method").c_str(),
        paymentMethod ? paymentMethod : "UNKNOWN"
    );

    prefs.putString(
        keyFor(i, "created").c_str(),
        createdAt ? createdAt : ""
    );

    queueCount++;
    nextLocalId++;

    if(nextLocalId == 0)
        nextLocalId = 1;

    saveMeta();

    Serial.print("OFFLINE QUEUE: saved transaction #");
    Serial.print(nextLocalId - 1);
    Serial.print(" | pending=");
    Serial.println(queueCount);

    return true;
}

uint16_t offlineQueueCount()
{
    return queueCount;
}

bool offlineQueueGet(uint16_t index, OfflineTransaction& record)
{
    if(index >= queueCount)
        return false;

    memset(&record, 0, sizeof(record));

    record.localId =
        prefs.getUInt(
            keyFor(index, "id").c_str(),
            0
        );

    String customer =
        prefs.getString(
            keyFor(index, "customer").c_str(),
            "Customer"
        );

    String service =
        prefs.getString(
            keyFor(index, "service").c_str(),
            "Carwash"
        );

    String status =
        prefs.getString(
            keyFor(index, "status").c_str(),
            "COMPLETED"
        );

    String method =
        prefs.getString(
            keyFor(index, "method").c_str(),
            "UNKNOWN"
        );

    String created =
        prefs.getString(
            keyFor(index, "created").c_str(),
            ""
        );

    copyString(
        record.customerName,
        sizeof(record.customerName),
        customer.c_str()
    );

    copyString(
        record.service,
        sizeof(record.service),
        service.c_str()
    );

    copyString(
        record.status,
        sizeof(record.status),
        status.c_str()
    );

    copyString(
        record.paymentMethod,
        sizeof(record.paymentMethod),
        method.c_str()
    );

    copyString(
        record.createdAt,
        sizeof(record.createdAt),
        created.c_str()
    );

    record.payment =
        prefs.getFloat(
            keyFor(index, "payment").c_str(),
            0.0f
        );

    record.durationMinutes =
        prefs.getUShort(
            keyFor(index, "duration").c_str(),
            0
        );

    return true;
}

bool offlineQueueRemove(uint16_t index)
{
    if(index >= queueCount)
        return false;

    // Shift every later record toward index 0.
    for(uint16_t i = index; i + 1 < queueCount; ++i)
    {
        OfflineTransaction next;

        if(!offlineQueueGet(i + 1, next))
            return false;

        prefs.putUInt(
            keyFor(i, "id").c_str(),
            next.localId
        );

        prefs.putString(
            keyFor(i, "customer").c_str(),
            next.customerName
        );

        prefs.putString(
            keyFor(i, "service").c_str(),
            next.service
        );

        prefs.putFloat(
            keyFor(i, "payment").c_str(),
            next.payment
        );

        prefs.putUShort(
            keyFor(i, "duration").c_str(),
            next.durationMinutes
        );

        prefs.putString(
            keyFor(i, "status").c_str(),
            next.status
        );

        prefs.putString(
            keyFor(i, "method").c_str(),
            next.paymentMethod
        );

        prefs.putString(
            keyFor(i, "created").c_str(),
            next.createdAt
        );
    }

    const uint16_t last = queueCount - 1;

    prefs.remove(keyFor(last, "id").c_str());
    prefs.remove(keyFor(last, "customer").c_str());
    prefs.remove(keyFor(last, "service").c_str());
    prefs.remove(keyFor(last, "payment").c_str());
    prefs.remove(keyFor(last, "duration").c_str());
    prefs.remove(keyFor(last, "status").c_str());
    prefs.remove(keyFor(last, "method").c_str());
    prefs.remove(keyFor(last, "created").c_str());

    queueCount--;
    saveMeta();

    return true;
}

bool offlineQueueHasPending()
{
    return queueCount > 0;
}
